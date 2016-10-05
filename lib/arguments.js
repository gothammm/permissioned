'use strict';
const R = require('ramda');
const ACLError = require('./error');

class Arguments {
  constructor(params) {
    this.params = params;
  }
  expect() {
    let _self = this;
    let err = [];
    _self.arguments = arguments;
    for (let i = 0, length = arguments.length; i < length; i++) {
      let val = _self.params[i];
      let expect = _self.arguments[i].split('|');
      if (R.contains(R.type(val).toLowerCase(), expect)) {
        continue;
      } else {
        err.push(
          new ACLError('INVALID_ARGUMENTS', i, _self.arguments[i], val)
        );
      }
    }
    return err;
  }
}

module.exports = Arguments;