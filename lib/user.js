'use strict';
const Arguments = require('./arguments');
const Bluebird = require('bluebird');
const R = require('ramda');
const Helper = require('./helper');
class User extends Helper {
  constructor(storage, userId) {
    super();
    let _self = this;
    let err = new Arguments(arguments).expect('object', 'string');
    if (err) {
      throw err;
    }
    _self.userId = userId;
    _self.storage = storage;
    _self.containers = storage.containers;
    _self._transactions = [];
  }
  get userId() { 
    return this._userId;
  }
  set userId(val) {
    if (this._userId && this.transactions.length) {
      /** Warn about pending transactions */
    }
    this._userId = val;
  }
  details() {
    let _self = this;
    let storage = _self.storage;
    let userDetails = Bluebird.coroutine(storage.get.bind(storage));
    return userDetails(_self.containers.USER, {
      user: _self.userId
    });
  }
  assign(roleId) {
    let _self = this;
    let storage = _self.storage;
    let err = new Arguments(arguments).expect('string');
    if (err) {
      throw err;
    }
    let assignUserToRole = Bluebird.coroutine(storage.add.bind(storage));
    _self._transactions.push({ 
      type: 'assign', 
      action: () => _self.details().then(user => assignUserToRole(
        _self.containers.USER,
        R.merge(user, {
          role: roleId
        })
      ))
    });
    return _self;
  }
  add(options) {
    let _self = this;
    let storage = _self.storage;
    let err = new Arguments(arguments).expect('object|undefined|null');
    options = options || {};
    if (err) {
      throw err;
    }
    if (_self._hasTransaction('add')) {
      // Maybe throw error? 
      return _self;
    }
    let addUser = Bluebird.coroutine(storage.add.bind(storage));
    _self._transactions.push({
      type: 'add',
      action: () => addUser(_self.containers.USER, {
        user: _self.userId,
        role: options.roleId || null,
        isBlocked: options.isBlocked || false,
        isActive: options.isActive === false ? false : true
      })
    });
    return _self;
  }
}

module.exports = User;