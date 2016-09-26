'use strict';

module.exports = {
  mongo: {
    indexes: {
      ACCESS: {
        fields: {
          role: 1,
          resource: 1
        },
        options: {
          unique: true,
          w: 1,
          background: true
        }
      }
    }
  }
};