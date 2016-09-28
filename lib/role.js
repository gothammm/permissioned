'use strict';
const Arguments = require('./arguments');
const Bluebird = require('bluebird');
const Helper = require('./helper');
class Role extends Helper {
  constructor(storage, roleName, roleId) {
    super();
    let _self = this;
    let err = new Arguments(arguments).expect('object', 'string', 'string|null');
    if (err) {
      throw err;
    }
    _self.roleName = roleName;
    _self.storage = storage;
    _self.containers = storage.containers;
    _self.roleId = roleId;
    _self._transactions = [];
  }
  add() {
    let _self = this;
    let storage = _self.storage;
    let addAction = Bluebird.coroutine(storage.add.bind(storage));
    _self._transactions.push({ 
      type: 'add', 
      action: () => addAction(_self.containers.ROLE, {
        name: _self.roleName
      })
    });
    return _self;
  }
}

module.exports = Role;