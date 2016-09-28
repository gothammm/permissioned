'use strict';
const Bluebird = require('bluebird');
const R = require('ramda');
class Helper {
  constructor() {

  }
  done() {
    let _self = this;
    let final = {
      resolved: [],
      rejected: []
    };
    if (_self.transactions && _self.transactions.length) {
      return Bluebird.all(
        _self.transactions.map(x => x.action().reflect())
      ).then(result => {
        for (let i = 0, length = result.length; i < length; i++) {
          let promise = result[i];
          if (promise.isFulfilled()) {
            final.resolved.push(promise.value());
          } else {
            final.rejected.push(promise.reason());
          }
        }
        _self.transactions = [];
        return final;
      });
    }
    return Bluebird.resolve(final);
  }
  _hasTransaction(type) {
    let _self = this;
    if (_self.transactions && _self.transactions.length) {
      return R.find(x => x.type === type) ? true : false
    }
    return false;
  }
}

module.exports = Helper;