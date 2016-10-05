'use strict';
const R = require('ramda');
const log = require('./log');
const ErrorMessages = {
  MONGO_ACTIVE_CONNECTION: 'An active mongo connection already exists'
};

class ACLError extends Error {
  constructor() {
    super();
    let _self = this;
    let args = arguments || [];
    let name = R.isArrayLike(args) && R.length(args) ? args[0] : 'GENERAL';
    _self._error = {};
    let error = (ErrorMessages[name] || ErrorMessages.GENERAL).apply(null, R.drop(1, args));
    _self._error = R.merge(_self._error, (R.is(Object, error) ? error : {}));
    _self.name = _self.constructor.name;
    _self.code = name;
    _self.message = _self._error.message;
    if (R.is(Function, Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(_self.message)).stack; 
    }
  }
  static wrap(err) {
    log.error(err);
    return ACLError(err.code || 'GENERAL', err);
  }
}

module.exports = ACLError;