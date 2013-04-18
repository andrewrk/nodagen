var DictMixin = require('../lib/dict_mixin')
  , assert = require('assert')
  , KeyError = require('../lib/key_error');

describe("DictMixin", function() {
  var fdict, rdict;
  beforeEach(function() {
    fdict = new FDict();
    rdict = {};
    fdict.setItem("foo", "bar");
    rdict.foo = "bar";
  });
  afterEach(function() {
    assertObjectsEqual(fdict, rdict);
  });
  it("getsetitem", function() {
    assert.strictEqual(fdict.getItem("foo"), "bar");
    assert.throws(function() {
      fdict.getItem("bar");
    }, /KeyError/);
  });
  it("has_key_contains", function() {
    assert.ok(fdict.has_key("foo"));
    assert.ok(!fdict.has_key("bar"));
  });
  it("clear", function() {
    fdict.clear();
    rdict = {};
    assert.strictEqual(fdict.keys().length, 0);
  });
  it("keys", function() {
    assert.deepEqual(fdict.keys(), Object.keys(rdict));
  });
  it("values", function() {
    assert.deepEqual(fdict.values(),
      Object.keys(rdict).map(function(x) { return rdict[x]; }));
  });
  it("items", function() {
    assert.deepEqual(fdict.items(), [['foo', 'bar']]);
  });
  it("pop", function() {
    var value = rdict.foo;
    delete rdict.foo;
    assert.strictEqual(fdict.pop("foo"), value);
    assert.throws(function() {
      fdict.pop("woo");
    }, /KeyError/);
  });
  it("popitem", function() {
    assert.deepEqual(fdict.popitem(), ['foo', 'bar']);
    delete rdict.foo;
    assert.throws(function() {
      fdict.popitem();
    }, /KeyError/);
  });
  it("update_other", function() {
    var other = {"a": 1, "b": 2};
    fdict.update(other);
    rdict.a = 1;
    rdict.b = 2;
  });
  it("update_other_is_list", function() {
    var other = [["a", 1], ["b", 2]];
    fdict.update(other);
    rdict.a = 1;
    rdict.b = 2;
  });
  it("setdefault", function() {
    fdict.setdefault("foo", "baz");
    if (!("foo" in rdict)) rdict.foo = "baz";
    fdict.setdefault("bar", "baz");
    if (!("bar" in rdict)) rdict.bar = "baz";
  });
  it("get", function() {
    assert.strictEqual(fdict.get("a"), rdict.a);
    assert.strictEqual(fdict.get("a", "b"), "b");
    assert.strictEqual(fdict.get("foo"), rdict.foo);
  });
  it("len", function() {
    assert.strictEqual(fdict.length(), Object.keys(rdict).length);
  });
});


Object.keys(DictMixin.prototype).forEach(function(method) {
  assert.ok(!FDict.prototype[method]);
  FDict.prototype[method] = DictMixin.prototype[method];
});
function FDict() {
  this.__d = {};
}
FDict.prototype.keys = function() {
  return Object.keys(this.__d);
};
FDict.prototype.getItem = function(key, _default) {
  if (key in this.__d) {
    return this.__d[key];
  } else if (arguments.length === 2) {
    return _default;
  } else {
    throw new KeyError(key);
  }
};
FDict.prototype.setItem = function(key, value) {
  this.__d[key] = value;
  return value;
};
FDict.prototype.delItem = function(key) {
  delete this.__d[key];
};

function assertObjectsEqual(fdict, rdict) {
  fdict.keys().forEach(function(key) {
    assert.strictEqual(fdict.getItem(key), rdict[key]);
  });
  Object.keys(rdict).forEach(function(key) {
    assert.strictEqual(fdict.getItem(key), rdict[key]);
  });
}
