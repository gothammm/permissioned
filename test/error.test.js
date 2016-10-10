'use strict';
const test = require('ava');
const ACLError = require('../lib/error');
const ErrorMessages = require('../lib/error').ErrorMessages;
const chai = require('chai');
const expect = chai.expect;


test('must generate a general error for an empty constructor', t => {
  let err = new ACLError();
  t.is(err.code, 'GENERAL');
  expect(err.message).to.contain('unknown error');
});

test('must generate general error for an invalid error type / code', t => {
  let err = new ACLError('UNKNOWN_ERROR_TEST');
  t.is(err.code, 'GENERAL');
  expect(err.message).to.contain('unknown error');
});

test('must return string for all error messages func', t => {
  let keys = Object.keys(ErrorMessages);

  for (let i = 0, length = keys.length; i < length; i++) {
    let funcResult = ErrorMessages[keys[i]]();
    t.is((typeof funcResult).toLowerCase(), 'string');
  }
});

test('must wrap Error types, and convert to GENERAL error', t => {
  let err = new Error('Test Error');
  let aclError = ACLError.wrap(err);

  expect(aclError).to.be.instanceof(Error);
  expect(aclError._details).to.be.instanceof(Error);
  t.is(aclError.code, 'GENERAL');
});

test('must wrap string, and convert to general error', t => {
  let err = 'Test Error';
  let aclError = ACLError.wrap(err);

  expect(aclError).to.be.instanceof(Error);
  expect(aclError.message).to.contain(err);
  t.is(aclError.code, 'GENERAL');
});

test('must return GENERAL error, while trying to wrap nothing.', t => {
  let aclError = ACLError.wrap();
  expect(aclError).to.be.instanceof(Error);
  t.is(aclError.code, 'GENERAL');
});