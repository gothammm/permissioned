'use strict';
const client = require('mongodb').MongoClient;
const dbUrl = 'mongodb://localhost:27017/acl_test';
const Bluebird = require('bluebird');
const log = require('../lib/log');
module.exports = {
  dbUrl,
  cleanup: function* () {
    let db = yield client.connect(dbUrl);
    let collections = yield db.collections();
    let dropCollection = yield collections.map(col => {
      log.info(`Dropping collection -  ${col.s.name}`);
      return col.drop();
    });
    return Bluebird.all(dropCollection).then(() => db.close());
  }
};