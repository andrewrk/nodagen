// FIXME: This test suite is a mess, a lot of it dates from PyMusepack so
// it doesn't match the other Mutagen test conventions/quality.

var path = require('path')
  , temp = require('temp')
  , assert = require('assert')
  , ncp = require('ncp').ncp
  , fs = require('fs')
  , apev2 = require('../').apev2
  , APEv2File = apev2.APEv2File
  , APEv2 = apev2.APEv2
  , is_valid_apev2_key = apev2.is_valid_apev2_key
  , data = path.join(__dirname, "data")
  , SAMPLE = path.join(data, "click.mpc")
  , OLD = path.join(data, "oldtag.apev2")
  , BROKEN = path.join(data, "brokentag.apev2")
  , LYRICS2 = path.join(data, "apev2-lyricsv2.mp3")

describe("is_valid_apev2_key", function() {
  it("yes", function() {
    ["foo", "Foo", "   f ~~~"].forEach(function(key) {
      assert.strictEqual(is_valid_apev2_key(key), true);
    });
  });
  it("no", function() {
    ["\x11hi", "ffoo\xFF", "\u1234",
    "a", "", "foo" * 100].forEach(function(key)
    {
      assert.strictEqual(is_valid_apev2_key(key), false);
    });
  });
});

describe("APEWriter", apeWriterTest(apeWriterTestSetup, function() {
  var filename = SAMPLE + ".tag_at_start";
  var tag = new APEv2(filename);
  tag.save();
  tag = new APEv2(filename);
  assert.equal(tag.getItem("album"), "Mutagen tests");
  var justtagsize = fs.statSync(SAMPLE + ".justtag").size;
  var othersize = fs.statSync(filename).size;
  assert.strictEqual(justtagsize, othersize - ("tag garbage".length * 1000));
}));


describe("APEv2ThenID3v1Writer", apeWriterTest(function(done) {
  var self = this;
  apeWriterTestSetup.call(self, function(err) {
    if (err) return done(err);
    self.offset = 128;
    var trash = "TAG";
    for (var i = 0; i < 125; ++i) {
      trash += "\x00";
    }
    var trashBuffer = new Buffer(trash, "binary");
    var f = fs.openSync(SAMPLE + ".new", "a+");
    fs.writeSync(f, trashBuffer, 0, trashBuffer.length, 0);
    fs.closeSync(f);
    f = fs.openSync(BROKEN + ".new", "a+");
    fs.writeSync(f, trashBuffer, 0, trashBuffer.length, 0);
    fs.closeSync(f);
    f = fs.openSync(SAMPLE + ".justtag", "a+");
    fs.writeSync(f, trashBuffer, 0, trashBuffer.length, 0);
    fs.closeSync(f);
    done();
  });
}, function() { }));


function apeWriterTestSetup(done) {
  var self = this;
  self.offset = 0;
  ncp(SAMPLE, SAMPLE + ".new", function(err) {
    if (err) return done(err);
    ncp(BROKEN, BROKEN + ".new", function(err) {
      if (err) return done(err);

      var tag = new APEv2();
      self.values = {"artist": "Joe Wreschnig\0unittest",
                     "album": "Mutagen tests",
                     "title": "Not really a song"};
      for (var k in self.values) {
        var v = self.values[k];
        tag.setItem(k, v);
      }
      tag.save(SAMPLE + ".new");
      tag.save(SAMPLE + ".justtag");
      tag.save(SAMPLE + ".tag_at_start");
      var fileobj = fs.openSync(SAMPLE + ".tag_at_start", "a");
      var garbage = "";
      for (var i = 0; i < 1000; ++i) {
        garbage += "tag garbage";
      }
      var garbageBuffer = new Buffer(garbage, "binary");
      fs.writeSync(fileobj, garbageBuffer, 0, garbageBuffer.length, 0);
      fs.closeSync(fileobj);
      self.tag = new APEv2(SAMPLE + ".new");
      done();
    });
  });
}
function apeWriterTest(beforeFn, tagAtStartWriteFn) {
  return function() {
    beforeEach(beforeFn);
    afterEach(function() {
      fs.unlinkSync(SAMPLE + ".new");
      fs.unlinkSync(BROKEN + ".new");
      fs.unlinkSync(SAMPLE + ".justtag");
      fs.unlinkSync(SAMPLE + ".tag_at_start");
    });
    it("changed", function() {
      var oldSize = fs.statSync(SAMPLE + ".new").size;
      this.tag.save();
      var newSize = fs.statSync(SAMPLE + ".new").size;
      assert.strictEqual(newSize, oldSize - this.offset);
    });
    it("fix_broken", function() {
      // Clean up garbage from a bug in pre-Mutagen APEv2.
      // This also tests removing ID3v1 tags on writes.
      var oldSize = fs.statSync(OLD).size;
      var brokenSize = fs.statSync(BROKEN).size;
      assert.notEqual(oldSize, brokenSize);
      var tag = new APEv2(BROKEN);
      tag.save(BROKEN + ".new");
      oldSize = fs.statSync(OLD).size;
      var newBrokenSize = fs.statSync(BROKEN+".new").size;
      assert.strictEqual(oldSize, newBrokenSize);
    });
    it("readback", function() {
      var self = this;
      self.tag.items().forEach(function(item) {
        var k = item[0]
          , v = item[1];
        assert.strictEqual(v.toString(), self.values[k]);
      });
    });
    it("size", function() {
      var sampleNewSize = fs.statSync(SAMPLE + ".new").size;
      var sampleSize = fs.statSync(SAMPLE).size;
      var sampleJustTagSize = fs.statSync(SAMPLE + ".justtag").size;
      assert.strictEqual(sampleNewSize, sampleSize + sampleJustTagSize);
    });
    it("delete", function() {
      apev2.delete(SAMPLE + ".justtag");
      var tag = new APEv2(SAMPLE + ".new");
      tag.delete();
      var sampleJustTagSize = fs.statSync(SAMPLE + ".justtag").size;
      assert.strictEqual(sampleJustTagSize, this.offset);
      var sampleSize = fs.statSync(SAMPLE).size;
      var sampleNewSize = fs.statSync(SAMPLE + ".new").size;
      assert.strictEqual(sampleSize + this.offset, sampleNewSize);
      assert.strictEqual(tag.keys().length, 0);
    });
    it("empty", function() {
      assert.throws(function() {
        var x = new APEv2(path.join(data, "emptyfile.mp3"));
      }, /No APE tag found/);
    });
    it("tag_at_start", function() {
      var filename = SAMPLE + ".tag_at_start";
      var tag = new APEv2(filename);
      assert.equal(tag.getItem("album"), "Mutagen tests");
    });
    it("tag_at_start_write", tagAtStartWriteFn);
    it("tag_at_start_delete", function() {
      var filename = SAMPLE + ".tag_at_start";
      var tag = new APEv2(filename);
      tag.delete();
      assert.throws(function() {
        var x = new APEv2(filename);
      }, /No APE tag found/);
      var size = fs.statSync(filename).size;
      assert.strictEqual(size, "tag garbage".length * 1000);
    });
    it("case_preservation", function() {
      apev2.delete(SAMPLE + ".justtag");
      var tag = new APEv2(SAMPLE + ".new");
      tag.setItem("FoObaR", "Quux");
      tag.save();
      tag = new APEv2(SAMPLE + ".new");
      assert.notEqual(tag.keys().indexOf("FoObaR"), -1);
      assert.equal(tag.keys().indexOf("foobar"), -1);
    });
    it("unicode_key", function() {
      // http://code.google.com/p/mutagen/issues/detail?id=123
      var tag = new APEv2(SAMPLE + ".new");
      tag.setItem("abc", "\xf6\xe4\xfc");
      tag.setItem("cba", "abc");
      tag.save();
    });
  };
}

function apev2TestSetup(done) {
  var self = this;
  self.filename = temp.path();
  ncp(OLD, self.filename, function(err) {
    if (err) return done(err);
    self.audio = new APEv2(self.filename);
    done();
  });
}

describe("APEv2", apev2Test(apev2TestSetup));

describe("APEv2ThenID3v1", apev2Test(function(done) {
  var self = this;
  apev2TestSetup.call(self, function(err) {
    if (err) return done(err);
    var trash = "TAG";
    for (var i = 0; i < 125; ++i) {
      trash += "\x00";
    }
    var trashBuffer = new Buffer(trash, "binary");
    var f = fs.openSync(self.filename, "a+");
    fs.writeSync(f, trashBuffer, 0, trashBuffer.length, 0);
    fs.closeSync(f);
    self.audio = new APEv2(self.filename);
    done();
  });
}));

function apev2Test(beforeFn) {
  return function() {
    before(beforeFn);
    after(function(done) {
      fs.unlink(this.filename, done);
    });
    it("invalid_key", function() {
      var self = this;
      assert.throws(function() {
        self.audio.setItem("\u1234", "foo");
      }, /KeyError/);
    });
    it("guess_text", function() {
      this.audio.setItem("test", "foobar");
      assert.equal(this.audio.getItem("test"), "foobar");
      assert.ok(this.audio.getItem("test") instanceof apev2.APETextValue);
    });
    it("guess_text_list", function() {
      this.audio.setItem("test", ["foobar", "quuxbarz"]);
      assert.equal(this.audio.getItem("test"), "foobar\x00quuxbarz");
      assert.ok(this.audio.getItem("test") instanceof apev2.APETextValue);
    });
    it("guess_not_utf8", function() {
      this.audio.setItem("test", new Buffer("\xa4woo", "binary"));
      assert.ok(this.audio.getItem("test") instanceof apev2.APEBinaryValue);
      assert.strictEqual(this.audio.getItem("test").value.length, 4);
      this.audio.delItem("test");
    });
    it("bad_value_type", function() {
      assert.throws(function() {
        apev2.APEValue("foo", 99);
      }, /AssertionError/);
    });
    it("module_delete_empty", function() {
      apev2.delete(path.join(data, "emptyfile.mp3"));
    });
    it("invalid", function() {
      assert.throws(function() {
        var x = new apev2.APEv2("dne");
      }, /ENOENT/);
    });
    it("no_tag", function() {
      assert.throws(function() {
        var x = new apev2.APEv2(path.join(data, "emptyfile.mp3"));
      }, /No APE tag found/);
    });
    it("cases", function() {
      assert.strictEqual(this.audio.getItem("artist"), this.audio.getItem("ARTIST"));
      assert.ok(this.audio.has_key("artist"));
      assert.ok(this.audio.has_key("artisT"));
    });
    it("keys", function() {
      assert.ok(this.audio.keys().indexOf("Track") >= 0);
      assert.ok(this.audio.values().filter(function(value) {
        return value.toString() === "AnArtist";
      }).length);
    });
    it("invalid_keys", function() {
      var audio = this.audio;
      assert.throws(function() {
        audio.getItem("\x00");
      }, /KeyError/);
      assert.throws(function() {
        audio.setItem("\x00", "");
      }, /KeyError/);
      assert.throws(function() {
        audio.delItem("\x00");
      }, /KeyError/);
    });
    it("dictlike", function() {
      assert.ok(this.audio.get("track"));
      assert.ok(this.audio.get("Track"));
    });
    it("del", function() {
      var audio = this.audio;
      var s = audio.get("artist");
      audio.delItem("artist");
      assert.strictEqual(audio.keys().indexOf("artist"), -1);
      assert.throws(function() {
        audio.getItem("artist");
      }, /KeyError/);
      audio.setItem("Artist", s);
      assert.equal(audio.getItem("artist"), "AnArtist");
    });
    it("values", function() {
      assert.strictEqual(this.audio.getItem("artist"), this.audio.getItem("artist"));
      assert.ok(this.audio.getItem("artist") < this.audio.getItem("title"));
      assert.equal(this.audio.getItem("artist"), "AnArtist");
      assert.equal(this.audio.getItem("title"), "Some Music");
      assert.equal(this.audio.getItem("album"), "A test case");
      assert.equal(this.audio.getItem("track"), "07");
      assert.notEqual(this.audio.getItem("album"), "A test Case");
    });
    it("pprint", function() {
      assert.strictEqual(this.audio.pprint(),
        'Album=A test case\nArtist=AnArtist\nTitle=Some Music\nTrack=07');
    });
  };
}

describe("APEv2WithLyrics2", function() {
  beforeEach(function() {
    this.tag = new APEv2(LYRICS2);
  });
  it("values", function() {
    assert.equal(this.tag.getItem("MP3GAIN_MINMAX"), "000,179");
    assert.equal(this.tag.getItem("REPLAYGAIN_TRACK_GAIN"), "-4.080000 dB");
    assert.equal(this.tag.getItem("REPLAYGAIN_TRACK_PEAK"), "1.008101");
  });
});

describe("APEBinaryValue", function() {
  var BV = apev2.APEBinaryValue;
  beforeEach(function() {
    this.sample = "\x12\x45\xde";
    this.value = new apev2.APEValue(this.sample, apev2.BINARY);
  });
  it("type", function() {
    assert.ok(this.value instanceof BV);
  });
  it("const", function() {
    assert.strictEqual(this.sample, this.value.toString());
  });
});

describe("APETextValue", function() {
  var TV = apev2.APETextValue;
  beforeEach(function() {
    this.sample = ["foo", "bar", "baz"];
    this.value = new apev2.APEValue(this.sample.join("\0"), apev2.TEXT);
  });
  it("type", function() {
    assert.ok(this.value instanceof TV);
  });
  it("toArray", function() {
    assert.deepEqual(this.sample, this.value.toArray());
  });
  it("fromArray", function() {
    var newValue = ["a", "b", "123"];
    this.value.fromArray(newValue);
    assert.deepEqual(newValue, this.value.toArray());
  });
});

describe("APEExtValue", function() {
  var EV = apev2.APEExtValue;
  beforeEach(function() {
    this.sample = "http://foo";
    this.value = new apev2.APEValue(this.sample, apev2.EXTERNAL);
  });
  it("type", function() {
    assert.ok(this.value instanceof EV);
  });
  it("const", function() {
    assert.strictEqual(this.sample, this.value.toString());
  });
});

describe("APEv2File", function() {
  var audio;
  beforeEach(function() {
    audio = new APEv2File(path.join(data, "click.mpc"));
  });
  it("add_tags", function() {
    assert.equal(audio.tags, null);
    audio.add_tags();
    assert.notEqual(audio.tags, null);
    assert.throws(function() {
      audio.add_tags();
    }, /AssertionError.*already has tags/);
  });
});
