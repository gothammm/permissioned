'use strict';
const Arguments = require('./arguments');
const Role = require('./role');
const User = require('./user');
const Bluebird = require('bluebird');
const R = require('ramda');

class ACL {
  constructor(storage) {
    let _self = this;
    let err = new Arguments(arguments).expect('object');
    if (err) {
      throw err;
    }
    _self.storage = storage;
    _self.containers = storage.containers;
  }
  role(name) {
    let _self = this;
    let err = new Arguments(arguments).expect('string');
    if (err) {
      throw err;
    }
    return new Role(_self.storage, name, null);
  }
  user(userId) {
    let _self = this;
    let err = new Arguments(arguments).expect('string');
    if (err) {
      throw err;
    }
    return new User(_self.storage, userId);
  }
  hasAccess(userId, resource, access) {
    let _self = this;
    let storage = _self.storage;
    let err = new Arguments(arguments).expect('string', 'string', 'string|array');
    if (err && err.length) {
      throw err;
    }
    let accessCount = Bluebird.coroutine(storage.count.bind(storage));
    let get = Bluebird.coroutine(storage.get.bind(storage));
    return Bluebird.coroutine(function* () {
      let user = yield get(_self.containers.USER, { user: userId });

      if (!user) {
        // or throw err, not sure.
        return false;
      }
      let accessQuery = {};
      if (R.is(Array, access)) {
        R.forEach(x => {
          accessQuery[x] = true;
        }, access);
      } else {
        accessQuery = {
          [`${access}`]: true
        };
      }
      let accessList = yield accessCount(_self.containers.ACCESS, {
        role: {
          $in: user.roles || []
        },
        resources: {
          $elemMatch: R.merge({
            resource
          }, accessQuery)
        }
      });
      return accessList > 0 ? true : false;
    })();
  }
}

module.exports = ACL;