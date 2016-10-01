'use strict';
const Storage = require('./storage');
const Arguments = require('./arguments');
const Enums = require('./enum');
const client = require('mongodb').MongoClient;
const R = require('ramda');
const cuid = require('cuid');
const Bluebird = require('bluebird');
const mongoConfig = require('./config').mongo;

class MongoStorage extends Storage {
  constructor(opts) {
    super('mongo');
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
    let indexes = mongoConfig.indexes[container.toUpperCase()];
    let collection = _self.db.collection(_self._getCollectionName(container));
    yield collection.updateOne({ _id }, { $set: doc }, {
      upsert: true
    });

    if (indexes && R.is(Object, indexes)) {
      yield collection.createIndex(indexes.fields, indexes.options);
    }
    return doc;
  }
  *get(container, key, select) {
    let _self = this;
    select = select || {};
    let err = new Arguments(arguments).expect('string', 'object', 'object|undefined|null');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.findOne(key, select);
  }
  *count(container, key) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.count(key);
  }
  *all(container, key, options) {
    let _self = this;
    options = options || {};
    let err = new Arguments(arguments).expect('string', 'object');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    let query = collection.find(key);
    if (options && (!R.isEmpty(options.select) || !R.isNil(options.select))) {
      query = query.project(options.select);
    }
    if (options && R.is(Number, options.limit) && (!R.isEmpty(options.limit) || !R.isNil(options.limit))) {
      query = query.limit(+options.limit);
    }
    return yield query.toArray();
  }
  *remove(container, key) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object', 'object');
    if (err) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    
    if (!R.isEmpty(key)) {
      return yield collection.deleteMany(key).then(() => true);
    }
    return true;
  }
  _getUrl(opts) {
    let _self = this;
    if (opts.url && R.is(String, opts.url) && _self._isValidUrl(opts.url)) {
      return opts.url;
    }
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
  _clean(options) {
    let _self = this;
    options = options || {};
    let drop = options.drop || false;
    return Bluebird.resolve().then(() => {
      if (drop) {
        let arr = R.map(x => {
          let collectionName = _self._getCollectionName(x);
          let collection = _self.db.collection(collectionName);
          return Bluebird.try(() => collection.drop(collectionName));
        }, Enums.container.mongo);
        return Bluebird.all(R.values(arr).map(x => x.reflect()));
      }
      return;
    }).then(() => new Bluebird((resolve, reject) => {
      _self.db.close(err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }));
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

module.exports = MongoStorage;
