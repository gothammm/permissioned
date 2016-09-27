'use strict';
const Arguments = require('./arguments');
const Bluebird = require('bluebird');

class User {
  constructor(storage, userId) {
    let _self = this;
    let err = new Arguments(arguments).expect('object', 'string');
    if (err) {
      throw err;
    }
    _self.userId = userId;
    _self.storage = storage;
    _self.containers = storage.containers;
    _self.payload = null;
  }
  details() {
    let _self = this;
    let storage = _self.storage;
    let userDetails = Bluebird.coroutine(storage.get.bind(storage));
    return userDetails(_self.containers.USER, {
      user: _self.userId
    }).catch(console.log);
  }
  role() {

  }
  add() {
    let err = new Arguments(arguments).expect('string');
    if (err) {
      throw err;
    }
  }
}

module.exports = User;