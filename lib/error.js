'use strict';
const R = require('ramda');

const ErrorMessages = {
  MONGO_ACTIVE_CONNECTION: () => 'An active mongo connection already exists',
  ACTIVE_CONNECTION: () => `An active storage connection already exists`,
  MONGO_INACTIVE: () => `No active mongo connection found.`,
  GENERAL: (message) => `Unable to process: ${message || 'unknown error'}`,
  BAD_QUERY: (message) => `Bad Query detected: ${message}`,
  INVALID_ROLE: (role) => `Invalid role: ${role}`,
  ROLE_NOT_FOUND: (role) => `Role not found: ${role}`,
  INVALID_ARGUMENTS: (index, argVal, val) => `Expected argument[index-${index}] to be "${argVal}" but got "${R.type(val).toLowerCase()}"`
};

class ACLError extends Error {
  constructor() {
    super();
    let _self = this;
    let args = arguments;
    let name = R.isArrayLike(args) && R.length(args) ? args[0] : 'GENERAL';
    _self._error = {};
    let message = (ErrorMessages[name] || ErrorMessages.GENERAL).apply(null, R.drop(1, args));
    _self.name = _self.constructor.name;
    _self.code = ErrorMessages[name] ? name : 'GENERAL';
    _self.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
  static wrap(err) {
    let aclErr;
    if (R.is(Error, err)) {
      aclErr = new ACLError(err.code || 'GENERAL', err.message);
      aclErr._details = err;
    } else if(R.is(String, err)) {
      aclErr = new ACLError('GENERAL', err);
    } else {
      aclErr = new ACLError('GENERAL');
    }
    return aclErr;
  }
}

module.exports = ACLError;
module.exports.ErrorMessages = ErrorMessages;