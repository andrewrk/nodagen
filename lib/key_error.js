module.exports = KeyError;

var util = require('util');

util.inherits(KeyError, Error);
function KeyError() {
  Error.call(this, arguments);
  this.name = "KeyError";
}
