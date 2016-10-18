# Class User

> User class, that represents the users of a particular role, basically a subset entity of [Roles](./role.md)

* **NOTE** - this class instance, can be accessed via the base [Permissioned](./permissioned.md) class

## Parameters

* **Storage**: *object*
  * The type of storage, to be used by the ACL class to keep track of roles / users / access lists.
  * Types of storages:
      * *MongoStorage*
      * *InMemoryStorage* - (**to be part of >=2.0.0**)
* **UserId**: *string*
  * Custom defined User Id (the user id that's used in your app) , that you want to define / or access

## Methods

* *add(options)* => `Promise<Object>`
  * Parameters
    * options - `object` - Options, with which the user can be modified, during creation.
      * roleId - `string` - Role Id to be assigned.
      * isBlocked - `boolean` - Is the user blocked from any kind of acces.
    ```js
    // Sample options
    {
      "roleId": "ciu8hrq2z0001cez0b6w04ekq",
      "isBlocked": false
    }
    ```
  * Returns
    * `Promise` that resolves to the new user that's saved in the [storage](#storage)
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let user = acl.user('myUniqueUserId');

    user.add().then(savedUser => {
      console.log(savedUser);
      /**
       {
         "_id": "ciu8hrq2z0001cez0b6w04ekq",
         "user": "<userId>",
         "roles": [<ArrayOfRoleIds],
         "isBlocked": false
       }
      **/
    });
    ```

* *assign(roleName)* => `Promise<Object>`
  * Parameters
    * roleName - `string` - Name of the role, to assign the user.
  * Returns
    * `Promise` that resolves to the user assigned to the role, that's saved in the [storage](#storage)
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let user = acl.user('myUniqueUserId');
    let role = acl.role('Administrator');

    user.add().then(() => role.add()).then(() => user.assign('Administrator'));
    ```

* *details()* => `Promise<Object>`
  * Returns
    * `Promise` that resolves to the user details.
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let user = acl.user('myUniqueUserId');

    user.details(); // returns a promise with user details.
    ```