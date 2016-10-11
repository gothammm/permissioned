'use strict';
const test = require('ava');
const Role = require('../lib/role');
const chai = require('chai');
const expect = chai.expect;
const ACLError = require('../lib/error');
const MongoStorage = require('../lib/mongo-storage');
const util = require('./util');
const cuid = require('cuid');


test.beforeEach(t => {
  t.context.dbUrl = util.dbUrl;
  t.context.testUrl = util.testUrl;
  t.context.storage = new MongoStorage({
    url: t.context.dbUrl,
    prefix: 'acl'
  });
  return t.context.storage._ready();
});

test('must throw error while constructing role instance without storage or name', t => {
  t.throws(() => new Role(), (val) => {
    t.is(val.constructor.name, Array.name);
    t.is(val.length, 2);
    val.forEach(err => {
      t.is(err.constructor.name, ACLError.name);
    });
    return true;
  });
});

test('must throw error for an invalid storage param', t => {
  t.throws(() => new Role({}, 'dummyRoleName'), ACLError);
});

test('must return a role instance, with mongo storage and a role name', t => {
  let role = new Role(t.context.storage, 'SomeRole');
  t.is(role.roleName, 'SomeRole');
  t.is(role.storage.constructor.name, MongoStorage.name);
});

test('#add - must throw error while saving a role with invalid name', t => {
  let role = new Role(t.context.storage, 'SomeRole');

  // Override role name
  role.roleName = { name: 'invalid value' };
  t.throws(role.add(), ACLError);
});

test('#add - must save a new role, based of a name', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  return role.add().then(r => t.is(r.name, roleName));
});

test('#details - must fetch role details for a particular role name', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  return role.add().then(() => role.details()).then(r => {
    t.is(r.name, roleName)
    t.is(r.constructor.name, Object.name);
    return r;
  });
});

test('#allow - must throw error for invalid parameters', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  t.throws(() => role.allow(), (val) => {
    t.is(val.constructor.name, Array.name);
    t.is(val.length, 2);
    val.forEach(err => {
      t.is(err.constructor.name, ACLError.name);
    });
    return true;
  });
});

test('#allow - must throw error while giving access for an invalid role', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  return role.allow(resourceName, {}).catch(err => {
    expect(err).to.be.instanceof(ACLError);
    expect(err.code).to.equal('ROLE_NOT_FOUND');
  });
});

test('#allow - must create a new access list for a role', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  let savedRole;

  return role.add().then((r) => {
    savedRole = r;
    return role.allow(resourceName, { read: true })
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(1);
    access.resources.forEach(a => {
      t.is(a.resource, resourceName);
      t.is(a.create, false);
      t.is(a.update, false);
      t.is(a.delete, false);
      t.is(a.read, true);
    });
  });
});

test('#allow - must create default access list with false values', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  let savedRole;

  return role.add().then((r) => {
    savedRole = r;
    return role.allow(resourceName, {});
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(1);
    access.resources.forEach(a => {
      t.is(a.resource, resourceName);
      t.is(a.create, false);
      t.is(a.update, false);
      t.is(a.delete, false);
      t.is(a.read, false);
    });
  });
});



test('#allow - must append a new access list to an existing one.', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  let resourceNameTwo = cuid();
  let savedRole;

  return role.add().then((r) => {
    savedRole = r;
    return role.allow(resourceName, { read: true, create: true, delete: true, update: true });
  }).then(() => {
    return role.allow(resourceNameTwo, { read: true, create: true, delete: true, update: true });
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(2);
    access.resources.forEach(a => {
      t.is(a.create, true);
      t.is(a.update, true);
      t.is(a.delete, true);
      t.is(a.read, true);
    });
  });
});

test('#allow - must create access list for all the access provided', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  let savedRole;

  return role.add().then((r) => {
    savedRole = r;
    return role.allow(resourceName, { read: true, create: true, delete: true, update: true });
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(1);
    access.resources.forEach(a => {
      t.is(a.resource, resourceName);
      t.is(a.create, true);
      t.is(a.update, true);
      t.is(a.delete, true);
      t.is(a.read, true);
    });
  });
});

test('#allow - must update an existing access', t => {
  let roleName = `sampleRole-${cuid()}`;
  let role = new Role(t.context.storage, roleName);
  let resourceName = cuid();
  let savedRole;

  return role.add().then((r) => {
    savedRole = r;
    return role.allow(resourceName, { read: true, create: true, delete: true, update: true });
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(1);
    access.resources.forEach(a => {
      t.is(a.resource, resourceName);
      t.is(a.create, true);
      t.is(a.update, true);
      t.is(a.delete, true);
      t.is(a.read, true);
    });
  }).then(() => {
    return role.allow(resourceName, { read: false, create: true, delete: false, update: true });
  }).then(access => {
    expect(access).to.be.an('object');
    expect(access.role).to.be.equal(savedRole._id);
    expect(access.resources).to.have.length(1);
    access.resources.forEach(a => {
      t.is(a.resource, resourceName);
      t.is(a.create, true);
      t.is(a.update, true);
      t.is(a.delete, false);
      t.is(a.read, false);
    });
  });
});



test.afterEach.always('close active connection', t => {
  t.context.storage.clean();
});

test.after.always('cleanup', util.cleanup);