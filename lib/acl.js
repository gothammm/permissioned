'use strict';
const R = require('ramda');
const cuid = require('cuid');
const MongoStorage = require('./mongo-storage');
const Arguments = require('./arguments');
const Role = require('./role');
const User = require('./user');

class ACL {
  constructor(storage) {
    let _self = this;
    let err = new Arguments(arguments).expect('object');
    if (err) {
      throw err;
    }
    _self.storage = storage;
  } 
  role(name) {
    let _self = this;
    let err = new Arguments(arguments).expect('string');
    return new Role(_self.storage, name, null);
  }
  user(userId) {
    let _self = this;
    let err = new Arguments(arguments).expect('string');
    return new User(_self.storage, userId);
  }
}

module.exports = ACL;