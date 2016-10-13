# Class Permissioned

> Permissioned class, which is the main gateway to creating users, roles and assigning users to a specific role.

## Parameters

* **Storage**: *object*
  * The type of storage, to be used by the ACL class to keep track of roles / users / access lists.
  * Types of storages:
      * *MongoStorage*
      * *InMemoryStorage* - (**to be part of >=2.0.0**)

## Methods

* *role(name)* => [Role](#role)
  * Parameters
    * name - `string` - name of a role.
  * Returns
    * instance of [Role](#role) for the provided role name.
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let role = acl.role('Administrator');
    ```
    
* *user(userId)* => [User](#user)
  * Parameters
    * userId - `string` - User's unique identifier (Example: mongo's ObjectID / guid)
  * Returns
    * instance of [User](#user) for the provided user's unique identifier.
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    let user = acl.user('ciu8gtp460000cez0ntnho6cc'); // replace 'ciu8gtp460000cez0ntnho6cc' with your own unique identifier
    ```

* *hasAccess(userId, resource, access)* => Promise
  * Parameters
    * userId - `string` - User's unique identifier.
    * resource - `string` - Resource name
    * access - `object` - Access Details
  * Returns
    * `Promise` that resolves to value `true` or `false` which basically means, if the `userId` has access for the given `resource` and `access` Details
  * Usage
    ```javascript
    const Permissioned = require('permissioned');
    const acl = new Permissioned(Permissioned.mongoStorage({
      url: 'mongodb://localhost/acl',
      prefix: 'acl'
    }));

    acl.hasAccess('ciu8gtp460000cez0ntnho6cc', 'Member', { read: true }).then(hasAccess => {
      if (hasAccess) {
        // Yay I can read Member resource
      } else {
        // Whoops no cookie for you.
      }
    });
    ```
