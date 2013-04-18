// FIXME: This test suite is a mess, a lot of it dates from PyMusepack so
// it doesn't match the other Mutagen test conventions/quality.

var path = require('path')
  , temp = require('temp')
  , assert = require('assert')
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

describe("APEWriter", APEWriterTest(0, function() {
    def setUp(self):
        import shutil
        shutil.copy(SAMPLE, SAMPLE + ".new")
        shutil.copy(BROKEN, BROKEN + ".new")
        tag = mutagen.apev2.APEv2()
        self.values = {"artist": "Joe Wreschnig\0unittest",
                       "album": "Mutagen tests",
                       "title": "Not really a song"}
        for k, v in self.values.items():
            tag[k] = v
        tag.save(SAMPLE + ".new")
        tag.save(SAMPLE + ".justtag")
        tag.save(SAMPLE + ".tag_at_start")
        fileobj = open(SAMPLE + ".tag_at_start", "ab")
        fileobj.write("tag garbage" * 1000)
        fileobj.close()
        self.tag = mutagen.apev2.APEv2(SAMPLE + ".new")
}, function() {
  def test_tag_at_start_write(self):
      filename = SAMPLE + ".tag_at_start"
      tag = mutagen.apev2.APEv2(filename)
      tag.save()
      tag = mutagen.apev2.APEv2(filename)
      self.failUnlessEqual(tag["album"], "Mutagen tests")
      self.failUnlessEqual(
          os.path.getsize(SAMPLE + ".justtag"),
          os.path.getsize(filename) - (len("tag garbage") * 1000))
}));


describe("APEv2ThenID3v1Writer", APEWriterTest(128, function() {
    def setUp(self):
        super(TAPEv2ThenID3v1Writer, self).setUp()
        f = open(SAMPLE + ".new", "ab+")
        f.write("TAG" + "\x00" * 125)
        f.close()
        f = open(BROKEN + ".new", "ab+")
        f.write("TAG" + "\x00" * 125)
        f.close()
        f = open(SAMPLE + ".justtag", "ab+")
        f.write("TAG" + "\x00" * 125)
        f.close()

}, function() { });

function APEWriterTest(offset, beforeFn, tagAtStartWriteFn) {
  return function() {
    var offset = offset;
    before(beforeFn);
    after(function() {
      fs.unlinkSync(SAMPLE + ".new");
      fs.unlinkSync(BROKEN + ".new");
      fs.unlinkSync(SAMPLE + ".justtag");
      fs.unlinkSync(SAMPLE + ".tag_at_start");
    });
    it("changed", function() {
      def test_changed(self):
          size = os.path.getsize(SAMPLE + ".new") 
          self.tag.save()
          self.failUnlessEqual(
              os.path.getsize(SAMPLE + ".new"), size - self.offset)

    });
    it("fix_broken", function() {
      def test_fix_broken(self):
          # Clean up garbage from a bug in pre-Mutagen APEv2.
          # This also tests removing ID3v1 tags on writes.
          self.failIfEqual(os.path.getsize(OLD), os.path.getsize(BROKEN))
          tag = mutagen.apev2.APEv2(BROKEN)
          tag.save(BROKEN + ".new")
          self.failUnlessEqual(
              os.path.getsize(OLD), os.path.getsize(BROKEN+".new"))

    });
    it("readback", function() {
      def test_readback(self):
          for k, v in self.tag.items():
              self.failUnlessEqual(str(v), self.values[k])

    });
    it("size", function() {
      def test_size(self):
          self.failUnlessEqual(
              os.path.getsize(SAMPLE + ".new"),
              os.path.getsize(SAMPLE) + os.path.getsize(SAMPLE + ".justtag"))

    });
    it("delete", function() {
      def test_delete(self):
          mutagen.apev2.delete(SAMPLE + ".justtag")
          tag = mutagen.apev2.APEv2(SAMPLE + ".new")
          tag.delete()
          self.failUnlessEqual(os.path.getsize(SAMPLE + ".justtag"), self.offset)
          self.failUnlessEqual(os.path.getsize(SAMPLE) + self.offset,
                               os.path.getsize(SAMPLE + ".new"))
          self.failIf(tag)
    });
    it("empty", function() {
      def test_empty(self):
          self.failUnlessRaises(
              IOError, mutagen.apev2.APEv2,
              os.path.join("tests", "data", "emptyfile.mp3"))

    });
    it("tag_at_start", function() {
      def test_tag_at_start(self):
          filename = SAMPLE + ".tag_at_start"
          tag = mutagen.apev2.APEv2(filename)
          self.failUnlessEqual(tag["album"], "Mutagen tests")

    });
    it("tag_at_start_write", tagAtStartWriteFn);
    it("tag_at_start_delete", function() {
      def test_tag_at_start_delete(self):
          filename = SAMPLE + ".tag_at_start"
          tag = mutagen.apev2.APEv2(filename)
          tag.delete()
          self.failUnlessRaises(IOError, mutagen.apev2.APEv2, filename)
          self.failUnlessEqual(
              os.path.getsize(filename), len("tag garbage") * 1000)

    });
    it("case_preservation", function() {
      def test_case_preservation(self):
          mutagen.apev2.delete(SAMPLE + ".justtag")
          tag = mutagen.apev2.APEv2(SAMPLE + ".new")
          tag["FoObaR"] = "Quux"
          tag.save()
          tag = mutagen.apev2.APEv2(SAMPLE + ".new")
          self.failUnless("FoObaR" in tag.keys())
          self.failIf("foobar" in tag.keys())

    });
    it("unicode_key", function() {
      def test_unicode_key(self):
          # http://code.google.com/p/mutagen/issues/detail?id=123
          tag = mutagen.apev2.APEv2(SAMPLE + ".new")
          tag["abc"] = u'\xf6\xe4\xfc'
          tag[u"cba"] = "abc"
          tag.save()
    });
  };
});

describe("APEv2", APEv2Test(function() {
    def setUp(self):
        fd, self.filename = mkstemp(".apev2")
        os.close(fd)
        shutil.copy(OLD, self.filename)
        self.audio = APEv2(self.filename)
}));

describe("APEv2ThenID3v1", APEv2Test(function() {
    def setUp(self):
        super(TAPEv2ThenID3v1, self).setUp()
        f = open(self.filename, "ab+")
        f.write("TAG" + "\x00" * 125)
        f.close()
        self.audio = APEv2(self.filename)
}));

function APEv2Test(beforeFn) {
  return function() {
    before(beforeFn);
    after(function() {
      def tearDown(self):
          os.unlink(self.filename)
    });
    it("invalid_key", function() {
      def test_invalid_key(self):
          self.failUnlessRaises(
              KeyError, self.audio.__setitem__, u"\u1234", "foo")
    });
    it("guess_text", function() {
      def test_guess_text(self):
          from mutagen.apev2 import APETextValue
          self.audio["test"] = u"foobar"
          self.failUnlessEqual(self.audio["test"], "foobar")
          self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it("guess_text_list", function() {
      def test_guess_text_list(self):
          from mutagen.apev2 import APETextValue
          self.audio["test"] = [u"foobar", "quuxbarz"]
          self.failUnlessEqual(self.audio["test"], "foobar\x00quuxbarz")
          self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it("guess_utf8", function() {
      def test_guess_utf8(self):
          from mutagen.apev2 import APETextValue
          self.audio["test"] = "foobar"
          self.failUnlessEqual(self.audio["test"], "foobar")
          self.failUnless(isinstance(self.audio["test"], APETextValue))

    });
    it("guess_not_utf8", function() {
      def test_guess_not_utf8(self):
          from mutagen.apev2 import APEBinaryValue
          self.audio["test"] = "\xa4woo"
          self.failUnless(isinstance(self.audio["test"], APEBinaryValue))
          self.failUnlessEqual(4, len(self.audio["test"]))
    });
    it("bad_value_type", function() {
      def test_bad_value_type(self):
          from mutagen.apev2 import APEValue
          self.failUnlessRaises(ValueError, APEValue, "foo", 99)
    });
    it("module_delete_empty", function() {
      def test_module_delete_empty(self):
          from mutagen.apev2 import delete
          delete(os.path.join("tests", "data", "emptyfile.mp3"))
    });
    it("invalid", function() {
      def test_invalid(self):
          self.failUnlessRaises(IOError, mutagen.apev2.APEv2, "dne")

    });
    it("no_tag", function() {
      def test_no_tag(self):
          self.failUnlessRaises(IOError, mutagen.apev2.APEv2,
                                os.path.join("tests", "data", "empty.mp3"))
    });
    it("cases", function() {
      def test_cases(self):
          self.failUnlessEqual(self.audio["artist"], self.audio["ARTIST"])
          self.failUnless("artist" in self.audio)
          self.failUnless("artisT" in self.audio)
    });
    it("keys", function() {
      def test_keys(self):
          self.failUnless("Track" in self.audio.keys())
          self.failUnless("AnArtist" in self.audio.values())

          self.failUnlessEqual(
              self.audio.items(), zip(self.audio.keys(), self.audio.values()))
    });
    it("invalid_keys", function() {
      def test_invalid_keys(self):
          self.failUnlessRaises(KeyError, self.audio.__getitem__, "\x00")
          self.failUnlessRaises(KeyError, self.audio.__setitem__, "\x00", "")
          self.failUnlessRaises(KeyError, self.audio.__delitem__, "\x00")
    });
    it("dictlike", function() {
      def test_dictlike(self):
          self.failUnless(self.audio.get("track"))
          self.failUnless(self.audio.get("Track"))
    });
    it("del", function() {
      def test_del(self):
          s = self.audio["artist"]
          del(self.audio["artist"])
          self.failIf("artist" in self.audio)
          self.failUnlessRaises(KeyError, self.audio.__getitem__, "artist")
          self.audio["Artist"] = s
          self.failUnlessEqual(self.audio["artist"], "AnArtist")
    });
    it("values", function() {
      def test_values(self):
          self.failUnlessEqual(self.audio["artist"], self.audio["artist"])
          self.failUnless(self.audio["artist"] < self.audio["title"])
          self.failUnlessEqual(self.audio["artist"], "AnArtist")
          self.failUnlessEqual(self.audio["title"], "Some Music")
          self.failUnlessEqual(self.audio["album"], "A test case")
          self.failUnlessEqual("07", self.audio["track"])

          self.failIfEqual(self.audio["album"], "A test Case")
    });
    it("pprint", function() {
      def test_pprint(self):
          self.failUnless(self.audio.pprint())
    });
  };
}

describe("APEv2WithLyrics2", function() {
  before(function() {
    def setUp(self):
        self.tag = mutagen.apev2.APEv2(LYRICS2)

  });
  it("values", function() {
    def test_values(self):
        self.failUnlessEqual(self.tag["MP3GAIN_MINMAX"], "000,179")
        self.failUnlessEqual(self.tag["REPLAYGAIN_TRACK_GAIN"], "-4.080000 dB")
        self.failUnlessEqual(self.tag["REPLAYGAIN_TRACK_PEAK"], "1.008101")
  });
});

describe("APEBinaryValue", function() {
  var BV = apev2.APEBinaryValue;
  before(function() {
    def setUp(self):
        self.sample = "\x12\x45\xde"
        self.value = mutagen.apev2.APEValue(self.sample,mutagen.apev2.BINARY)
  });
  it("type", function() {
    def test_type(self):
        self.failUnless(isinstance(self.value, self.BV))
  });
  it("const", function() {
    def test_const(self):
        self.failUnlessEqual(self.sample, str(self.value))
  });
  it("repr", function() {
    def test_repr(self):
        repr(self.value)
  });
});

describe("APETextValue", function() {
  var TV = apev2.APETextValue;
  before(function() {

    def setUp(self):
        self.sample = ["foo", "bar", "baz"]
        self.value = mutagen.apev2.APEValue(
            "\0".join(self.sample), mutagen.apev2.TEXT)
  });
  it("type", function() {
    def test_type(self):
        self.failUnless(isinstance(self.value, self.TV))
  });
  it("list", function() {
    def test_list(self):
        self.failUnlessEqual(self.sample, list(self.value))
  });
  it("setitem_list", function() {
    def test_setitem_list(self):
        self.value[2] = self.sample[2] = 'quux'
        self.test_list()
        self.test_getitem()
        self.value[2] = self.sample[2] = 'baz'
  });
  it("getitem", function() {
    def test_getitem(self):
        for i in range(len(self.value)):
            self.failUnlessEqual(self.sample[i], self.value[i])
  });
  it("repr", function() {
    def test_repr(self):
        repr(self.value)
  });
});

describe("APEExtValue", function() {
  var EV = apev2.APEExtValue;
  before(function() {
    def setUp(self):
        self.sample = "http://foo"
        self.value = mutagen.apev2.APEValue(
            self.sample, mutagen.apev2.EXTERNAL)

  });
  it("type", function() {
    def test_type(self):
        self.failUnless(isinstance(self.value, self.EV))
  });
  it("const", function() {
    def test_const(self):
        self.failUnlessEqual(self.sample, str(self.value))
  });
  it("repr", function() {
    def test_repr(self):
        repr(self.value)
  });
});

describe("APEv2File", function() {
  before(function() {
    def setUp(self):
        self.audio = APEv2File("tests/data/click.mpc")
  });
  it("add_tags", function() {
    def test_add_tags(self):
        self.failUnless(self.audio.tags is None)
        self.audio.add_tags()
        self.failUnless(self.audio.tags is not None)
        self.failUnlessRaises(ValueError, self.audio.add_tags)
  });
});
