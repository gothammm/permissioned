'use strict';
const Storage = require('./storage');
const Arguments = require('./arguments');
const Enums = require('./enum');
const client = require('mongodb').MongoClient;
const R = require('ramda');
const cuid = require('cuid');
const Bluebird = require('bluebird');
const ACLError = require('./error');
const log = require('./log');

class MongoStorage extends Storage {
  constructor(opts) {
    super('mongo');
    let _self = this;
    _self.connStringRegex = /^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)(\w+?):(\d+)\/(\w+?)$/;
    _self.url = _self._getUrl(R.is(String, opts) ? { url: opts } : opts);
    _self.prefix = (opts && opts.prefix && opts.prefix.toString()) || 'acl';
    _self
      .init()
      .then((db) => _self.db = db)
      .then(() => _self.status = 1)
      .then(() => _self._onConnected())
      .catch(err => _self._onError(err));
  }
  get db() {
    if (!this._db) {
      throw new ACLError('MONGO_INACTIVE');
    }
    return this._db;
  }
  set db(conn) {
    if (conn) {
      this._db = conn;
    }
  }
  _ready() {
    let _self = this;
    return new Bluebird(resolve => _self.on('ready', () => resolve()));
  }
  _getCollectionName(name) {
    return `${this.prefix ? `${this.prefix}_` : ''}${name}`;
  }
  *add(container, data) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (!R.isEmpty(err)) {
      return yield Bluebird.reject(err);
    }
    let doc = R.merge({ _id: cuid() }, data);
    let _id = doc._id;
    let collection = _self.db.collection(_self._getCollectionName(container));

    log.info(`Adding / Updating record - ${JSON.stringify(doc)}`);

    yield collection.updateOne({ _id }, { $set: doc }, {
      upsert: true
    });

    return doc;
  }
  *get(container, key, select) {
    let _self = this;
    select = select || {};
    let err = new Arguments(arguments).expect('string', 'object', 'object|undefined|null');
    if (!R.isEmpty(err)) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.findOne(key, select);
  }
  *count(container, key) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (!R.isEmpty(err)) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.count(key);
  }
  *all(container, key, options) {
    let _self = this;
    options = options || {};
    let err = new Arguments(arguments).expect('string', 'object', 'object|undefined|null');
    if (!R.isEmpty(err)) {
      return yield Bluebird.reject(err);
    }
    let collection = _self.db.collection(_self._getCollectionName(container));
    let query = collection.find(key);
    if (options && R.is(Object, options.select) && !R.isEmpty(options.select)) {
      query = query.project(options.select);
    }
    if (options && R.is(Number, options.limit)) {
      query = query.limit(+options.limit);
    }
    return yield query.toArray();
  }
  *remove(container, key) {
    let _self = this;
    let err = new Arguments(arguments).expect('string', 'object');
    if (!R.isEmpty(err)) {
      return yield Bluebird.reject(err);
    }
    if (R.isEmpty(key)) {
      log.warn(`empty key query - is lethal. seriously, you want everything deleted?`);
      return Bluebird.reject(new ACLError(`BAD_QUERY`, `empty key query - ${JSON.stringify(key)}`));
    }
    log.info(`Removing records for key - ${JSON.stringify(key)}`);
    let collection = _self.db.collection(_self._getCollectionName(container));
    return yield collection.deleteMany(key).then(() => true);
  }
  _getUrl(opts) {
    let _self = this;
    opts = opts || {};
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
          log.warn(`Dropping collections - ${collectionName}`);
          return Bluebird.try(() => collection.drop(collectionName));
        }, Enums.container.mongo);
        return Bluebird.all(R.values(arr).map(x => x.reflect()));
      }
      return;
    }).then(() => new Bluebird(resolve => {
      _self.db.close(() => resolve());
    }));
  }
  _connect() {
    let _self = this;
    return new Bluebird((resolve, reject) => {
      client.connect(_self.url, (err, db) => {
        if (err) {
          log.error(err);
          return reject(ACLError.wrap(err));
        }
        return resolve(db);
      });
    });
  }
}

module.exports = MongoStorage;
