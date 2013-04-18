module.exports = DictMixin;

var assert = require('assert');
var KeyError = require('./key_error');

// Implement the dict API using keys() and __*item__ methods.
//
// Similar to UserDict.DictMixin, this takes a class that defines
// __getitem__, __setitem__, __delitem__, and keys(), and turns it
// into a full dict-like object.
//
// UserDict.DictMixin is not suitable for this purpose because it's
// an old-style class.
//
// This class is not optimized for very large dictionaries; many
// functions have linear memory requirements. I recommend you
// override some of these functions if speed is required.
function DictMixin() {

}

DictMixin.prototype.has_key = function(key) {
  try {
    this.getItem(key);
  } catch (err) {
    if (err.name === 'KeyError') {
      return false;
    } else {
      throw err;
    }
  }
  return true;
};

DictMixin.prototype.values = function() {
  var self = this;
  return self.keys().map(function(key) {
    return self.getItem(key);
  });
};

DictMixin.prototype.items = function() {
  return zip(this.keys(), this.values());
};

DictMixin.prototype.clear = function() {
  var self = this;
  self.keys().forEach(function(key) {
    self.delItem(key);
  });
};

DictMixin.prototype.pop = function(key, _default) {
  var args = Array.prototype.slice.call(arguments, 1);
  assert.ok(args.length <= 2, "pop takes at most two arguments");
  var value;
  try {
    value = this.getItem(key);
  } catch (err) {
    if (err.name === 'KeyError' && args.length === 2) {
      return _default;
    } else {
      throw err;
    }
  }
  this.delItem(key);
  return value
};

DictMixin.prototype.popitem = function() {
  var key = this.keys()[0];
  if (key == null) throw new KeyError("dictionary is empty");
  return [key, this.pop(key)];
};

DictMixin.prototype.update = function(other) {
  var self = this;
  if (other == null) {
    self.update.apply(self, arguments.slice(1));
    other = {};
  }
  if (other.items != null) {
    other.items().forEach(function(item) {
      self.setItem(item[0], item[1]);
    });
  } else if (Array.isArray(other)) {
    other.forEach(function(item) {
      self.setItem(item[0], item[1]);
    });
  } else {
    for (var k in other) {
      var v = other[k];
      self.setItem(k, v);
    }
  }
};

DictMixin.prototype.setdefault = function(key, _default) {
  try {
    return this.getItem(key);
  } catch (err) {
    if (err.name === 'KeyError') {
      this.setItem(key, _default);
      return _default;
    } else {
      throw err;
    }
  }
};

DictMixin.prototype.get = function(key, _default) {
  try {
    return this.getItem(key);
  } catch (err) {
    if (err.name === 'KeyError') {
      return _default;
    } else {
      throw err;
    }
  }
};

DictMixin.prototype.length = function() {
  return this.keys().length;
};

// TODO - delete these?
// def __repr__(self):
//     return repr(dict(self.items()))

//  def __cmp__(self, other):
//      if other is None: return 1
//      else: return cmp(dict(self.items()), other)


function zip() {
  var len = arguments[0].length;
  var i;
  for (i = 1; i < arguments.length; ++i) {
    if (arguments[i].length < len) len = arguments[i].length;
  }
  var results = [];
  for (i = 0; i < len; ++i) {
    var a = [];
    for (var j = 0; j < arguments.length; ++j) {
      a.push(arguments[j][i]);
    }
    results.push(a);
  }
  return results;
}
