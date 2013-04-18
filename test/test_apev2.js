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
  self.offset = 128;
  apeWriterTestSetup.call(self, function(err) {
    if (err) return done(err);
    var trash = "TAG";
    for (var i = 0; i < 125; ++i) {
      trash += "\x00";
    }
    var trashBuffer = new Buffer(trash, "ascii");
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
      var garbageBuffer = new Buffer(garbage, "ascii");
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
    it.skip("changed", function() {
      var oldSize = fs.statSync(SAMPLE + ".new").size;
      this.tag.save();
      var newSize = fs.statSync(SAMPLE + ".new").size;
      assert.strictEqual(newSize, oldSize - this.offset);
    });
    it.skip("fix_broken", function() {
      //def test_fix_broken(self):
      //    # Clean up garbage from a bug in pre-Mutagen APEv2.
      //    # This also tests removing ID3v1 tags on writes.
      //    self.failIfEqual(os.path.getsize(OLD), os.path.getsize(BROKEN))
      //    tag = mutagen.apev2.APEv2(BROKEN)
      //    tag.save(BROKEN + ".new")
      //    self.failUnlessEqual(
      //        os.path.getsize(OLD), os.path.getsize(BROKEN+".new"))

    });
    it.skip("readback", function() {
      //def test_readback(self):
      //    for k, v in self.tag.items():
      //        self.failUnlessEqual(str(v), self.values[k])

    });
    it.skip("size", function() {
      //def test_size(self):
      //    self.failUnlessEqual(
      //        os.path.getsize(SAMPLE + ".new"),
      //        os.path.getsize(SAMPLE) + os.path.getsize(SAMPLE + ".justtag"))

    });
    it.skip("delete", function() {
      //def test_delete(self):
      //    mutagen.apev2.delete(SAMPLE + ".justtag")
      //    tag = mutagen.apev2.APEv2(SAMPLE + ".new")
      //    tag.delete()
      //    self.failUnlessEqual(os.path.getsize(SAMPLE + ".justtag"), self.offset)
      //    self.failUnlessEqual(os.path.getsize(SAMPLE) + self.offset,
      //                         os.path.getsize(SAMPLE + ".new"))
      //    self.failIf(tag)
    });
    it.skip("empty", function() {
      //def test_empty(self):
      //    self.failUnlessRaises(
      //        IOError, mutagen.apev2.APEv2,
      //        os.path.join("tests", "data", "emptyfile.mp3"))

    });
    it.skip("tag_at_start", function() {
      //def test_tag_at_start(self):
      //    filename = SAMPLE + ".tag_at_start"
      //    tag = mutagen.apev2.APEv2(filename)
      //    self.failUnlessEqual(tag["album"], "Mutagen tests")

    });
    it("tag_at_start_write", tagAtStartWriteFn);
    it.skip("tag_at_start_delete", function() {
      //def test_tag_at_start_delete(self):
      //    filename = SAMPLE + ".tag_at_start"
      //    tag = mutagen.apev2.APEv2(filename)
      //    tag.delete()
      //    self.failUnlessRaises(IOError, mutagen.apev2.APEv2, filename)
      //    self.failUnlessEqual(
      //        os.path.getsize(filename), len("tag garbage") * 1000)

    });
    it.skip("case_preservation", function() {
      //def test_case_preservation(self):
      //    mutagen.apev2.delete(SAMPLE + ".justtag")
      //    tag = mutagen.apev2.APEv2(SAMPLE + ".new")
      //    tag["FoObaR"] = "Quux"
      //    tag.save()
      //    tag = mutagen.apev2.APEv2(SAMPLE + ".new")
      //    self.failUnless("FoObaR" in tag.keys())
      //    self.failIf("foobar" in tag.keys())

    });
    it.skip("unicode_key", function() {
      //def test_unicode_key(self):
      //    # http://code.google.com/p/mutagen/issues/detail?id=123
      //    tag = mutagen.apev2.APEv2(SAMPLE + ".new")
      //    tag["abc"] = u'\xf6\xe4\xfc'
      //    tag[u"cba"] = "abc"
      //    tag.save()
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
    var trashBuffer = new Buffer(trash, "ascii");
    var f = fs.openSync(self.filename, "a+");
    fs.writeSync(f, trashBuffer, 0, trashBuffer.length, 0);
    fs.closeSync(f);
    self.audio = new APEv2(self.filename);
    done();
  });
}));

function apev2Test(beforeFn) {
  return function() {
    beforeEach(beforeFn);
    afterEach(function() {
      fs.unlinkSync(this.filename);
    });
    it.skip("invalid_key", function() {
      //def test_invalid_key(self):
      //    self.failUnlessRaises(
      //        KeyError, self.audio.__setitem__, u"\u1234", "foo")
    });
    it.skip("guess_text", function() {
      //def test_guess_text(self):
      //    from mutagen.apev2 import APETextValue
      //    self.audio["test"] = u"foobar"
      //    self.failUnlessEqual(self.audio["test"], "foobar")
      //    self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it.skip("guess_text_list", function() {
      //def test_guess_text_list(self):
      //    from mutagen.apev2 import APETextValue
      //    self.audio["test"] = [u"foobar", "quuxbarz"]
      //    self.failUnlessEqual(self.audio["test"], "foobar\x00quuxbarz")
      //    self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it.skip("guess_utf8", function() {
      //def test_guess_utf8(self):
      //    from mutagen.apev2 import APETextValue
      //    self.audio["test"] = "foobar"
      //    self.failUnlessEqual(self.audio["test"], "foobar")
      //    self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it.skip("guess_not_utf8", function() {
      //def test_guess_not_utf8(self):
      //    from mutagen.apev2 import APEBinaryValue
      //    self.audio["test"] = "\xa4woo"
      //    self.failUnless(isinstance(self.audio["test"], APEBinaryValue))
      //    self.failUnlessEqual(4, len(self.audio["test"]))
    });
    it.skip("bad_value_type", function() {
      //def test_bad_value_type(self):
      //    from mutagen.apev2 import APEValue
      //    self.failUnlessRaises(ValueError, APEValue, "foo", 99)
    });
    it.skip("module_delete_empty", function() {
      //def test_module_delete_empty(self):
      //    from mutagen.apev2 import delete
      //    delete(os.path.join("tests", "data", "emptyfile.mp3"))
    });
    it.skip("invalid", function() {
      //def test_invalid(self):
      //    self.failUnlessRaises(IOError, mutagen.apev2.APEv2, "dne")

    });
    it.skip("no_tag", function() {
      //def test_no_tag(self):
      //    self.failUnlessRaises(IOError, mutagen.apev2.APEv2,
      //                        os.path.join("tests", "data", "empty.mp3"))
    });
    it.skip("cases", function() {
      //def test_cases(self):
      //    self.failUnlessEqual(self.audio["artist"], self.audio["ARTIST"])
      //    self.failUnless("artist" in self.audio)
      //    self.failUnless("artisT" in self.audio)
    });
    it.skip("keys", function() {
      //def test_keys(self):
      //    self.failUnless("Track" in self.audio.keys())
      //    self.failUnless("AnArtist" in self.audio.values())

      //    self.failUnlessEqual(
      //        self.audio.items(), zip(self.audio.keys(), self.audio.values()))
    });
    it.skip("invalid_keys", function() {
      //def test_invalid_keys(self):
      //    self.failUnlessRaises(KeyError, self.audio.__getitem__, "\x00")
      //    self.failUnlessRaises(KeyError, self.audio.__setitem__, "\x00", "")
      //    self.failUnlessRaises(KeyError, self.audio.__delitem__, "\x00")
    });
    it.skip("dictlike", function() {
      //def test_dictlike(self):
      //    self.failUnless(self.audio.get("track"))
      //    self.failUnless(self.audio.get("Track"))
    });
    it.skip("del", function() {
      //def test_del(self):
      //    s = self.audio["artist"]
      //    del(self.audio["artist"])
      //    self.failIf("artist" in self.audio)
      //    self.failUnlessRaises(KeyError, self.audio.__getitem__, "artist")
      //    self.audio["Artist"] = s
      //    self.failUnlessEqual(self.audio["artist"], "AnArtist")
    });
    it.skip("values", function() {
      //def test_values(self):
      //    self.failUnlessEqual(self.audio["artist"], self.audio["artist"])
      //    self.failUnless(self.audio["artist"] < self.audio["title"])
      //    self.failUnlessEqual(self.audio["artist"], "AnArtist")
      //    self.failUnlessEqual(self.audio["title"], "Some Music")
      //    self.failUnlessEqual(self.audio["album"], "A test case")
      //    self.failUnlessEqual("07", self.audio["track"])

      //    self.failIfEqual(self.audio["album"], "A test Case")
    });
    it.skip("pprint", function() {
      //def test_pprint(self):
      //    self.failUnless(self.audio.pprint())
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
