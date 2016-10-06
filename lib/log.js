'use strict';
const TYPE = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN'
}
const pattern = (type, message) => `> [${type}] - [${(new Date()).toISOString()}] - ${message}`;
  
const logger = {
  info: (message) => console.log(pattern(TYPE.INFO, message)),
  warn: (message) => console.log(pattern(TYPE.WARN, message)),
  error: (message) => console.log(pattern(TYPE.ERROR, message))
};

module.exports = logger;