'use strict';
const chai = require('chai');
const test = require('ava');
const expect = chai.expect;
const MongoStorage = require('../lib/mongo-storage');
const util = require('./util');
test.beforeEach(t => {
  t.context.dbUrl = util.dbUrl;
});

test.cb('should initialize mongo storage', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
  storage.on('ready', () => {
    t.truthy(storage.db);
    t.pass();
    t.end();
  });
  storage.on('error', err => {
    t.fail(err);
    t.end();
  });
});

test('should get collection name  based on prefix', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
  t.is(storage._getCollectionName('mycol'), 'acl_mycol', 'collection name must have a prefix "acl_"');
});

test('should validate db url', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });

  let valid = storage._isValidUrl('mongodb://test:2723/dbName');
  let invalid = storage._isValidUrl('test');
  t.true(valid);
  t.false(invalid);
});

test.cb('should throw error when trying to initialize an active storage', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });

  storage.on('ready', () => {
    t.throws(storage.init(), Error);
    t.end();
  });
});


test.after.always('cleanup', util.cleanup);