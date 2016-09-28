'use strict';
const Bluebird = require('bluebird');
const R = require('ramda');
const EventEmiiter = require('events');
const Enums = require('./enum');

class Storage extends EventEmiiter {
  constructor(type) {
    super();
    let _self = this;
    _self.status = 0;
    _self._type = type || '';
  }
  get containers() {
    return Enums.container[this._type] || null;
  }
  init() {
    if (this.isActive) {
      return Bluebird.reject(/** reject for having an active storage */);
    }
    if (this._connect && R.is(Function, this._connect)) {
      return this._connect();
    }
    return Bluebird.reject(/** return an error */);
  }
  get isActive() {
    return this.status > 0 ? true : false;
  }
  _onConnected() {
    this.emit('ready');
  }
  _onError(err) {
    this.emit('error', err);
  }
  _onClean() {
    this.emit('clean');
  }
  clean() {
    let _self = this;
    let args = arguments;
    return Bluebird
      .resolve(_self.isActive)
      .then(() => {
        if (_self.isActive) {
          let clean = (_self._clean || _self._close);
          if (R.is(Function, clean)) {
            return clean.apply(_self, args);
          }
          return Bluebird.reject(/** Error for invalid clean func */);
        }
      })
      .then(() => _self._onClean())
      .catch(err => {
        this.emit('error', err);
        return Bluebird.reject(err);
      });
  }
}

module.exports = Storage;