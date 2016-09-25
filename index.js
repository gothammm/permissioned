'use strict';

/** ACL class */
const Bluebird = require('bluebird');
const EventEmiiter = require('events');
const R = require('ramda');
const client = require('mongodb').MongoClient;
const cuid = require('cuid');

class Storage extends EventEmiiter {
  constructor() {
    super();
    let _self = this;
    _self.status = 0;
  }
  init() {
    if (this.isActive) {
      return Bluebird.reject(/** reject for having an active storage */);
    }
    if (this._connect && R.is(Function, this._connect)) {
      return this._connect();
    }
    return Bluebird.reject(/** return an error */);
  }
  get isActive() {
    return this.status > 0 ? true : false;
  }
  _onConnected() {
    this.emit('ready');
  }
  _onError(err) {
    this.emit('error', err);
  }
  _onClean() {
    this.emit('clean');
  }
  clean() {
    let _self = this;
    return Bluebird
      .resolve(_self.isActive)
      .then(isActive => {
        if (_self.isActive) {
          let clean = (_self._clean || _self._close).bind(_self);
          if (R.is(Function, clean)) {
            return clean();
          }
          return Bluebird.reject(/** Error for invalid clean func */);
        }
      })
      .then(() => _self._onClean())
      .catch(err => {
        this.emit('error', err);
        return Bluebird.reject(err);
      });
  }
}

class Arguments {
  constructor(params) {
    this.params = params;
  }
  expect() {
    let _self = this;
    let err = [];
    _self.arguments = arguments;
    for (let i = 0, length = arguments.length; i < length; i++) {
      let val = _self.params[i];
      if (R.isNil(val) || R.isEmpty(val)) {
        continue;
      }
      if (R.type(val).toLowerCase() === _self.arguments[i].toString().toLowerCase()) {
        continue;
      } else {
        err.push(
          new Error(`Expected argument[index-${i}] to be "${_self.arguments[i]}" but got "${R.type(val).toLowerCase()}"`)
        );
      }
    }
    return err.length > 0 ? err : null;
  }
}

class MongoStorage extends Storage {
  constructor(opts) {
    super();
    let _self = this;
    _self.connStringRegex = /^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)(\w+?):(\d+)\/(\w+?)$/;
    _self.url = _self._getUrl(R.is(String, opts) ? { url: opts } : opts);
    _self.prefix = opts.prefix && opts.prefix.toString() || 'acl';
    _self
      .init()
      .then((db) => _self.db = db)
      .then(() => _self.status = 1)
      .then(() => _self._onConnected())
      .catch(err => _self._onError(err));
  }
  get db() {
    if (!this._db) {
      throw Error(/** throw error for invalid connection */);
    }
    return this._db;
  }
  set db(conn) {
    if (conn) {
      this._db = conn;
    }
  }
  _getCollectionName(name) {
    return `${this.prefix ? `${this.prefix}_` : ''}${name}`;
  }
  *add(container, data) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let doc = R.merge({ _id: cuid() }, data);
    let _id = doc._id;
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.updateOne({ _id }, { $set: doc }, {
      upsert: true,
      w: 1
    }).then(() => data);
  }
  *get(container, key) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.findOne(key);
  }
  _getUrl(opts) {
    let _self = this;
    if (opts.url && R.is(String, opts.url) && _self._isValidUrl(opts.url)) {
      return opts.url;
    }co
    let mongoConnString = 'mongodb://';
    if (opts.username && opts.password) {
      mongoConnString += `${opts.username}:${opts.password}@`;
    }
    if (opts.host) {
      mongoConnString += `${opts.host}:`;
    }
    if (opts.port) {
      mongoConnString += `${opts.port}/`;
    }
    if (opts.db) {
      mongoConnString += opts.db;
    }
    if (_self.isActive) {
      let clean = _self._clean || _self._close;
      if (R.is(Function, clean)) {
        return clean();
      }
      return Bluebird.reject(/** Error for invalid clean func */);
    }
    return mongoConnString;
  }
  _isValidUrl(url) {
    return this.connStringRegex.test(url || '');
  }
  _clean() {
    let _self = this;
    return new Bluebird((resolve, reject) => {
      _self.db.close((err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
  _connect() {
    let _self = this;
    return new Bluebird((resolve, reject) => {
      client.connect(_self.url, (err, db) => {
        if (err) {
          return reject(err);
        }
        return resolve(db);
      });
    });
  }
}


/** Dummy Test Area */
// let storage = new MongoStorage({
//   url: 'mongodb://localhost:27017/acl',
//   prefix: 'acl'
// });

// storage.on('ready', () => {
//   console.log('Ready..', storage.isActive);
//   let result = Bluebird.coroutine(storage.add.bind(storage));
//   let get = Bluebird.coroutine(storage.get.bind(storage));
//   result('users', {
//     user: cuid(),
//     role: cuid(),
//     isBlocked: false,
//     isActive: false
//   }).then(data => {
//     return get('users', 'test');
//   }).then((data) => {
//     return;
//   }).catch(err => {
//     console.log(err);
//   }).finally(() => storage.clean());
// });
// storage.on('clean', () => {
//   console.log('closed');
// });
// storage.on('error', (err) => console.log('Error..', err));