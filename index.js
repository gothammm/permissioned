'use strict';

module.exports = () => {};

/** Dummy Test Area */
const MongoStorage = require('./lib/mongo-storage');
const Bluebird = require('bluebird');
const cuid = require('cuid');
const Enums = require('./lib/enum');
let storage = new MongoStorage({
  url: 'mongodb://localhost:27017/acl',
  prefix: 'acl'
});

storage.on('ready', () => {
  console.log('Ready..', storage.isActive);
  let add = Bluebird.coroutine(storage.add.bind(storage));
  let get = Bluebird.coroutine(storage.get.bind(storage));
  add(Enums.container.mongo.USER, {
    user: cuid(),
    role: cuid(),
    isBlocked: false,
    isActive: false
  }).then(data => {
    return get(Enums.container.mongo.USER, { user: data.user });
  }).then((data) => {
    return add(Enums.container.mongo.ROLE, {
      _id: data.role,
      name: 'Administrator'
    });
  }).then(data => {
    return add(Enums.container.mongo.ACCESS, {
      role: data._id,
      resource: 'User',
      read: true,
      create: true,
      delete: true,
      update: true
    });
  }).catch(err => {
    console.log(err);
    console.log(err.stack);
  }).finally(() => storage.clean());
});
storage.on('clean', () => {
  console.log('closed');
});
storage.on('error', (err) => console.log('Error..', err));