var nodagen = require('../')
  , path = require('path')
  , assert = require('assert')
  , data = path.join(__dirname, "data")
  , FileType = nodagen.FileType
  , file = nodagen.file

describe("FileType", function() {
  var vorbis;
  beforeEach(function() {
    // TODO - make these tests not pending when vorbis is supported
    vorbis = file(path.join(data, "empty.ogg"));
  });
  it.skip("delitem_not_there", function() {
    assert.throws(function() {
      vorbis.delItem("foobar");
    }, /KeyError/);
  });
  it.skip("add_tags", function() {
    assert.throws(function() {
      var x = (new FileType()).add_tags();
    }, /Not implemented/);
  });
  it.skip("delitem", function() {
    vorbis.setItem("foobar", "quux");
    vorbis.delItem("foobar");
    assert.strictEqual(vorbis.values().indexOf("quux"), -1);
  });
});
