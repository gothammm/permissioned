'use strict';
const test = require('ava');
const ACLError = require('../lib/error');
const chai = require('chai');
const expect = chai.expect;
const MongoStorage = require('../lib/mongo-storage');
const util = require('./util');
const cuid = require('cuid');
const Bluebird = require('bluebird');

test.beforeEach(t => {
  t.context.dbUrl = util.dbUrl;
  t.context.testUrl = util.testUrl;
  t.context.storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
});

test.cb('should initialize mongo storage', t => {
  let storage = t.context.storage;
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

test('must drop collections with drop: true flag', t => {
  let storage = new MongoStorage({
    url: t.context.testUrl,
    prefix: 'acl'
  });;
  let add = Bluebird.coroutine(storage.add.bind(storage));
  storage.on('ready', () => {
    return add(storage.containers.USER, {
      user: cuid(),
      roles: [],
      isBlocked: false,
      isActive: true
    }).then(() => {
      return storage.clean({ drop: true });
    });
  });
});

test('should throw error trying to access inactive db instance', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
  t.throws(() => storage.db, ACLError);
});

test('should get collection name  based on prefix', t => {
  let storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
  t.is(storage._getCollectionName('mycol'), 'acl_mycol', 'collection name must have a prefix "acl_"');
});

test('should validate db url', t => {
  let storage = t.context.storage;

  let valid = storage._isValidUrl('mongodb://test:2723/dbName');
  let invalid = storage._isValidUrl('test');
  t.true(valid);
  t.false(invalid);
});

test.cb('should fail db connection', t => {
  let storage = new MongoStorage({
    url: 'mongodb://localhost:2723/dbName',
    prefix: 'acl'
  });

  storage.on('error', err => {
    t.is(err.constructor.name, ACLError.name);
    t.truthy(err);
    t.end();
  });
});

test.cb('should throw error when trying to initialize an active storage', t => {
  let storage = t.context.storage;
  storage.on('ready', () => {
    t.throws(storage.init(), ACLError);
    t.end();
  });
});

test('should return containers type', t => {
  let storage = t.context.storage;
  expect(storage.containers).to.be.an('object');
  expect(storage.containers.ROLE).to.be.a('string');
  expect(storage.containers.USER).to.be.a('string');
  expect(storage.containers.ACCESS).to.be.a('string');
});

test.cb('must clean any active mongo storage', t => {
  let storage = t.context.storage;
  storage.on('ready', () => {
    storage.clean();
  });
  storage.on('clean', () => {
    t.pass();
    t.end();
  });
});

test('#_getUrl must return a valid mongo string', t => {
  let storage = t.context.storage;
  let connStr = storage._getUrl({
    username: 'test',
    password: 'test',
    host: 'localhost',
    port: 27017,
    db: 'testdb'
  });

  t.true(storage._isValidUrl(connStr));
});

test('#add - must be a generator function', t => {
  let storage = t.context.storage;
  t.is(storage.add.constructor.name, 'GeneratorFunction');
});

test('#add - must throw error for invalid arguments', t => {
  let storage = t.context.storage;
  let fn = Bluebird.coroutine(storage.add.bind(storage));
  t.throws(fn(), (val) => {
    if (val && val.length) {
      val.forEach(x => expect(x).to.be.instanceof(ACLError));
    }
    return true;
  });
});

test('#add - must throw error for an invalid 2nd parameter', t => {
  let storage = t.context.storage;
  let fn = Bluebird.coroutine(storage.add.bind(storage));
  t.throws(fn(storage.containers.ROLE), (val) => {
    expect(val).to.have.length(1);
    val.forEach(x => expect(x).to.be.instanceof(ACLError));
    return true;
  });
});

test('#add - should add a new record', t => {
  let storage = t.context.storage;
  let fn = Bluebird.coroutine(storage.add.bind(storage));
  storage._ready().then(() => {
    return fn(storage.containers.USER, {
      user: cuid(),
      roles: [],
      isBlocked: false,
      isActive: true
    });
  });
});

test('#get - validate arguments', t => {
  let storage = t.context.storage;
  let fn = Bluebird.coroutine(storage.get.bind(storage));
  t.throws(fn(), (val) => {
    expect(val).to.have.length(2);
    val.forEach(x => expect(x).to.be.instanceof(ACLError));
    return true;
  });
});

test('#get - should fetch record by query', t => {
  let storage = t.context.storage;
  let get = Bluebird.coroutine(storage.get.bind(storage));
  let add = Bluebird.coroutine(storage.add.bind(storage));
  return Bluebird.coroutine(function* () {
    yield storage._ready();
    let record = yield add(storage.containers.USER, {
      user: cuid(),
      roles: [],
      isBlocked: false,
      isActive: true
    });
    let dbRecord = yield get(storage.containers.USER, { user: record.user });
    t.truthy(dbRecord);
  })().catch(err => t.fail(err));
});

test('#count - must validate parameters', t => {
  let storage = t.context.storage;
  let count = Bluebird.coroutine(storage.count.bind(storage));

  t.throws(count(), (val) => {
    expect(val).to.have.length(2);
    val.forEach(x => {
      t.is(x.constructor.name, ACLError.name);
    });
    return true;
  });
});

test('#count - should fetch count 0 for a query', t => {
  let storage = t.context.storage;
  let count = Bluebird.coroutine(storage.count.bind(storage));

  return Bluebird.coroutine(function* () {
    yield storage._ready();
    let totalCount = yield count(storage.containers.ROLE, {});
    t.is(0, totalCount);
  })().catch(err => t.fail(err));
});

test('#remove - must validate parameters', t => {
  let storage = t.context.storage;
  let remove = Bluebird.coroutine(storage.remove.bind(storage));

  t.throws(remove(), (val) => {
    expect(val).to.have.length(2);
    val.forEach(x => {
      t.is(x.constructor.name, ACLError.name);
    });
    return true;
  });
});

test('#remove - must fail for a bad query', t => {
  let storage = t.context.storage;
  let remove = Bluebird.coroutine(storage.remove.bind(storage));
  t.throws(remove(storage.containers.USER, {}), ACLError);
});


test('#remove - must remove the newly added record', t => {
  let storage = t.context.storage;
  let remove = Bluebird.coroutine(storage.remove.bind(storage));
  let add = Bluebird.coroutine(storage.add.bind(storage));
  let count = Bluebird.coroutine(storage.count.bind(storage));

  return Bluebird.coroutine(function* () {
    yield storage._ready();
    let record = yield add(storage.containers.USER, {
      user: cuid(),
      roles: [],
      isBlocked: false,
      isActive: true
    });
    yield remove(storage.containers.USER, { user: record.user });
    let dbRecord = yield count(storage.containers.USER, { user: record.user });
    t.is(0, dbRecord);
  })().catch(err => t.fail(err));
});

test('#all - must validate parameters', t => {
  let storage = t.context.storage;
  let count = Bluebird.coroutine(storage.all.bind(storage));

  t.throws(count(), (val) => {
    expect(val).to.have.length(2);
    val.forEach(x => {
      t.is(x.constructor.name, ACLError.name);
    });
    return true;
  });
});

test('#all - must fetch results for a specific field & limit', t => {
  let storage = t.context.storage;
  let all = Bluebird.coroutine(storage.all.bind(storage));
  let add = Bluebird.coroutine(storage.add.bind(storage));
  let uid = cuid();
  return storage._ready().then(() => add(storage.containers.USER, {
    user: uid,
    roles: [],
    isBlocked: false,
    isActive: true
  })).then(() => {
    return all(storage.containers.USER, { user: uid }, { limit: 10, select: { user: 1 } })
  }).then(users => {
    console.log(users);
    t.is(users.constructor.name, Array.name);
    t.is(users.length, 1);
    t.is(Object.keys(users[0]).length, 2);
    t.is(users[0].user, uid);;
    return users;
  });

});


test.afterEach.always('close active connection', t => {
  t.context.storage.clean();
});

test.after.always('cleanup', util.cleanup);