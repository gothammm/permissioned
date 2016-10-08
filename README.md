# Permissioned

> Access Control Lists made simple, for node.

* Role based authorization for node.js apps.
* Create roles and assign roles to users, assign users to multiple roles.
* Add custom role authorization handlers.
* Completely promise based API,

## Status 

[![Build Status](https://travis-ci.org/peek4y/permissioned.svg?branch=master)](https://travis-ci.org/peek4y/permissioned) 
[![dependencies Status](https://david-dm.org/peek4y/permissioned/status.svg)](https://david-dm.org/peek4y/permissioned)
[![Coverage Status](https://coveralls.io/repos/github/peek4y/permissioned/badge.svg?branch=master)](https://coveralls.io/github/peek4y/permissioned?branch=master)

## Table of Contents

* [What is it](#what-is-it)
* [Usage](#usage)

## What is it

Permissioned is a role based authorization module, that helps in granular authorization of a user, based on roles.
Create roles, assign users to the roles, decide what kind of resource the roles can access.

As of now, it uses mongodb as it's primary storage, future versions will include memory storage, and maybe even a SQL storage.


## Usage

```javascript
const ACL = require('permissioned').ACL;
const MongoStorage = require('permissioned').MongoStorage;
const Bluebird = require('bluebird');

const acl = new ACL(new ACL.MongoStorage({
  url: 'mongodb://localhost/acl',
  prefix: 'acl' // Collection prefx - eg: acl_users / acl_roles etc.
}));

let user = acl.user('uniqueUserId');
let adminRole = acl.role('Administrator');

Bluebird.all([user.add(), adminRole.add()]) // Save admin role & the user
  .then(() => user.assign('Administrator')) // Assign the user to 'Administrator' role.
  .then(() => adminRole.allow('MyResourceName', { read: true, update: true })) // Allow read / update access for the 'MyResourceName' resource
  .then(() => acl.hasAccess('uniqueUserId', 'MyResourceName', 'read')) // Check if the 'uniqueUserId' has read access for the resource name 'MyResourceName'
```

## TODO

- Need more tests.
- Complete API documentation
