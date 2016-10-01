'use strict';

module.exports = () => { };

/** Dummy Test Area */
const MongoStorage = require('./lib/mongo-storage');
const Bluebird = require('bluebird');
const cuid = require('cuid');
const Enums = require('./lib/enum');
let storage = new MongoStorage({
  url: 'mongodb://localhost:27017/acl',
  prefix: 'acl'
});
const R = require('ramda');
const ACL = require('./lib/acl');
storage.on('ready', () => {
  console.log('Ready..', storage.isActive);
  let acl = new ACL(storage);
  return Bluebird.coroutine(function* () {
    let role = yield acl.role('Administrator').add();
    let ccrep = yield acl.role('Ccrep').add();
    let user = acl.user(cuid());
    let savedUser = yield user.add();
    let updatedUser = yield user.assign(role.name);
    let updatedUserTwo = yield user.assign(ccrep.name);
    let userComplete = yield user.complete();
    console.log(userComplete);
    let access = yield acl.role('Administrator').allow('Member', { read: true, create: false });
    let accesstwo = yield acl.role('Ccrep').allow('Member', { read: true, create: true, delete: true });

    let resourceAccess = yield acl.hasAccess(savedUser.user, 'Member', ['create', 'read']);
    console.log('----------', resourceAccess);
    return storage.clean({ drop: true });
  })().catch(err => {
    console.log(err);
    console.log(err.stack);
  });
  // Bluebird.all(transactions.map(x => x()).map(x => x.reflect())).then(result => {
  //   console.log(result[0].reason());
  //   return storage.clean();
  // });
  // let add = Bluebird.coroutine(storage.add.bind(storage));
  // let get = Bluebird.coroutine(storage.get.bind(storage));
  // let remove = Bluebird.coroutine(storage.remove.bind(storage));
  // add(Enums.container.mongo.USER, {
  //   user: cuid(),
  //   role: cuid(),
  //   isBlocked: false,
  //   isActive: false
  // }).then(data => {
  //   return get(Enums.container.mongo.USER, { user: data.user });
  // }).then((data) => {
  //   return add(Enums.container.mongo.ROLE, {
  //     _id: data.role,
  //     name: 'Administrator'
  //   });
  // }).then(data => {
  //   return add(Enums.container.mongo.ACCESS, {
  //     role: data._id,
  //     resource: 'User',
  //     read: true,
  //     create: true,
  //     delete: true,
  //     update: true
  //   });
  // }).then(data => {
  //   return remove(Enums.container.mongo.ACCESS, {
  //     _id: data._id
  //   }).then((result) => {
  //     console.log('---------', result);
  //   });
  // }).catch(err => {
  //   console.log(err);
  //   console.log(err.stack);
  // }).finally(() => storage.clean());
});
storage.on('clean', () => {
  console.log('closed');
});
storage.on('error', (err) => console.log('Error..', err.stack));