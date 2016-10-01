'use strict';
const client = require('mongodb').MongoClient;
const dbUrl = 'mongodb://localhost:27017/acl_test';
module.exports = {
  dbUrl,
  cleanup: function* () {
    let db = yield client.connect(dbUrl);
    let collections = yield db.collections();
    let dropCollection = yield collections.map(col => {
      console.log('Dropping collection - ', col);
      return db.dropCollection(col);
    });
    return true;
  }
};