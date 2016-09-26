'use strict';
const R = require('ramda');

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
      if (R.isNil(val) || R.isEmpty(val)) {
        continue;
      }
      if (R.type(val).toLowerCase() === _self.arguments[i].toString().toLowerCase()) {
        continue;
      } else {
        err.push(
          new Error(`Expected argument[index-${i}] to be "${_self.arguments[i]}" but got "${R.type(val).toLowerCase()}"`)
        );
      }
    }
    return err.length > 0 ? err : null;
  }
}

module.exports = Arguments;