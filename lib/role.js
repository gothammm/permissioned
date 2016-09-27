'use strict';
const Arguments = require('./arguments');
const Bluebird = require('bluebird');
const Enums = require('./enum');

class Role {
  constructor(storage, roleName, roleId) {
    let _self = this;
    let err = new Arguments(arguments).expect('object', 'string', 'string|null');
    if (err) {
      throw err;
    }
    _self.roleName = roleName;
    _self.storage = storage;
    _self.containers = storage.containers;
    _self.roleId = roleId;
  }
  add() {
    let _self = this;
    let storage = _self.storage;
    let addAction = Bluebird.coroutine(storage.add.bind(storage));
    return addAction(_self.containers.ROLE, {
      name: _self.roleName
    }).then((role) => role).catch(err => err);
  }
}

module.exports = Role;