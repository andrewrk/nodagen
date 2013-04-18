module.exports = KeyError;

var util = require('util');
var AbstractError = require('./abstract_error');

util.inherits(KeyError, AbstractError);
function KeyError() {
  AbstractError.call(this, arguments);
}
