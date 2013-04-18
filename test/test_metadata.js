var util = require('util');
var assert = require('assert');
var Metadata = require('../').Metadata;

util.inherits(FakeMeta, Metadata);
function FakeMeta() {
  Metadata.apply(this, arguments);
}

describe("Metadata", function() {
  it("virtual_constructor", function() {
    assert.throws(function() {
      var x = new Metadata("filename");
    }, /Not implemented/);
  });
  it("load", function() {
    var m = new Metadata();
    assert.throws(function() {
      m.load("filename");
    }, /Not implemented/);
  });
  it("virtual_save", function() {
    assert.throws(function() {
      (new FakeMeta()).save();
    }, /Not implemented/);
    assert.throws(function() {
      (new FakeMeta()).save("Filename");
    }, /Not implemented/);
  });
  it("virtual_delete", function() {
    assert.throws(function() {
      (new FakeMeta()).delete();
    }, /Not implemented/);
    assert.throws(function() {
      (new FakeMeta()).delete("filename");
    }, /Not implemented/);
  });
});
