# Class Role

> Role class, represents the types of role that you can define, assign [users](#user) to the defined roles, and define the type of access list the role has, for different resources.

* **NOTE** - this class is used for internal purpose, can be access via the base [Permissioned](./permissioned.md) class

## Parameters

* **Storage**: *object*
  * The type of storage, to be used by the ACL class to keep track of roles / users / access lists.
  * Types of storages:
      * *MongoStorage*
      * *InMemoryStorage* - (**to be part of >=2.0.0**)
* **Name**: *string*
  * Name of the role, that you want to define / or access
  
## Methods

* *add()* => `Promise<Object>`
  * Returns
    * `Promise` that resolves to the new role that's saved in the [storage](#storage)
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let role = acl.role('Administrator');

    role.add().then(savedRole => {
      console.log(savedRole); // 'Administrator' role saved in the storage.
      /**
       {
         "_id": "ciu8hrq2z0001cez0b6w04ekq",
         "name": "Administrator"
       }
      **/
    });
    ```

* *details()* => `Promise<Object>`
  * Returns
    * `Promise` that resolves to the details of the role, for the given role name in class constructor.
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let role = acl.role('Administrator');

    role.details().then(roleDetails => {
      console.log(roleDetails); // 'Administrator' role saved in the storage.
      /**
      {
        "_id": "ciu8hrq2z0001cez0b6w04ekq",
        "name": "Administrator"
      }
      **/
    });
    ```

* *allow(resource, access)* => `Promise<Object>`
  * Parameters
    * resouce - `string` - Name of the resource, to define the access.
    * access - `object` - key-value pair, key being - read/update/create/delete, value being - true/false 
  * Returns
    * `Promise` that resolves to the details of the role, for the given role name in class constructor.
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let role = acl.role('Administrator');

    // Gives only 'read' access to resource 'Member', for the 'Administrator' role.
    role.allow('Member', { read: true }).then(accessDetails => {
      console.log(accessDetails); // 'Administrator' access details for the resource 'Member'.
    });
    ```
