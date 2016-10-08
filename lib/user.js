'use strict';
const Arguments = require('./arguments');
const Bluebird = require('bluebird');
const R = require('ramda');
const Role = require('./role');

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
  }
  get userId() {
    return this._userId;
  }
  set userId(val) {
    this._userId = val;
  }
  complete() {
    let _self = this;
    let storage = _self.storage;
    let getRole = Bluebird.coroutine(storage.all.bind(storage));
    let getAccess = Bluebird.coroutine(storage.all.bind(storage));

    return Bluebird.coroutine(function* () {
      let user = yield _self.details();
      if (!user) {
        return null;
      }
      let roles = yield getRole(_self.containers.ROLE, { _id: { $in: user.roles || [] } });
      let access = yield getAccess(_self.containers.ACCESS, { role: { $in: user.roles || [] } });

      let accessList = R.compose(
        R.flatten,
        R.map(x => x.resources.map(y => R.merge(y, { role: x.role })))
      );

      return R.merge(user, { roles, access: accessList(access) });
    })();
  }
  details() {
    let _self = this;
    let storage = _self.storage;
    let userDetails = Bluebird.coroutine(storage.get.bind(storage));
    return userDetails(_self.containers.USER, {
      user: _self.userId
    });
  }
  assign(roleName) {
    let _self = this;
    let storage = _self.storage;
    let err = new Arguments(arguments).expect('string');
    if (err && err.length) {
      throw err;
    }
    let assignUserToRole = Bluebird.coroutine(storage.add.bind(storage));

    return Bluebird.coroutine(function* () {
      let user = yield _self.details();
      if (!user) {
        return Bluebird.reject('User not found.');
      }
      let role = yield new Role(storage, roleName).details();
      if (!user.roles) {
        user.roles = [];
      }
      user.roles = user.roles.filter(x => x);
      user.roles.push(role._id);
      return yield assignUserToRole(
        _self.containers.USER,
        user
      );
    })();
  }
  add(options) {
    let _self = this;
    let storage = _self.storage;
    let err = new Arguments(arguments).expect('object|undefined|null');
    options = options || {};
    if (err && err.length) {
      throw err;
    }
    let addUser = Bluebird.coroutine(storage.add.bind(storage));
    return addUser(_self.containers.USER, {
      user: _self.userId,
      roles: [options.roleId] || null,
      isBlocked: options.isBlocked || false,
      isActive: options.isActive === false ? false : true
    });
  }
}

module.exports = User;