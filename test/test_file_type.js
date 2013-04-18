var nodagen = require('../')
  , path = require('path')
  , assert = require('assert')
  , data = path.join(__dirname, "data")
  , FileType = nodagen.FileType
  , file = nodagen.file

describe("FileType", function() {
  var vorbis;
  beforeEach(function() {
    vorbis = file(path.join(data, "empty.ogg"));
  });
  it("delitem_not_there", function() {
    assert.throws(function() {
      vorbis.delItem("foobar");
    }, /KeyError/);
  });
  it("add_tags", function() {
    assert.throws(function() {
      var x = (new FileType()).add_tags();
    }, /Not implemented/);
  });
  it("delitem", function() {
    vorbis.setItem("foobar", "quux");
    vorbis.delItem("foobar");
    assert.strictEqual(vorbis.values().indexOf("quux"), -1);
  });
});
