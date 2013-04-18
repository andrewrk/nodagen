module.exports = AbstractError;

var util = require('util');

util.inherits(AbstractError, Error);
function AbstractError(msg) {
  Error.captureStackTrace(this, this.constructor);
  this.message = msg;
  this.name = this.constructor.name;
}
