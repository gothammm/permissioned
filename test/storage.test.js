'use strict';
const test = require('ava');
const ACLError = require('../lib/error');
const Storage = require('../lib/storage');


test.beforeEach(t => {
  t.context.storage = new Storage();
});

test('#_onConnected - must emit ready event', t => {
  t.context.storage.on('ready', () => t.pass());
  t.context.storage._onConnected();
});

test('#init - must throw an inactive storage error', t => {
  t.throws(t.context.storage.init(), ACLError);
});

test('#init - must throw an active storage error', t => {
  let dummyActiveStorage = new Storage();
  dummyActiveStorage.status = 1;
  t.throws(dummyActiveStorage.init(), ACLError);
});

test('#clean - must throw an inactive storage error', t => {
  t.throws(t.context.storage.clean(), ACLError);
});

test(`#clean - must throw error for unimplemented clean func`, t => {
  let dummyStorage = new Storage();
  dummyStorage.status = 1;
  t.throws(dummyStorage.clean(), ACLError);
});

test(`#containers - must return null for invalid storage type`, t => {
  t.is(t.context.storage.containers, null);
});


test('#clean - must emit error for an inactive storage error', t => {
  t.context.storage.on('error', err => {
    t.is(err.constructor.name, ACLError.name);
    return true;
  });
  t.context.storage.clean().catch(err => {
    return err;
  });
});

