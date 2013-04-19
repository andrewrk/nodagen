var vorbis = require('../').vorbis
  , assert = require('assert')
  , VComment = vorbis.VComment
  , VCommentDict = vorbis.VCommentDict
  , istag = vorbis.istag;

describe("istag", function() {
  it("empty", function() {
    assert.strictEqual(istag(""), false);
  });
  it("tilde", function() {
    assert.strictEqual(istag("ti~tle"), false);
  });
  it("equals", function() {
    assert.strictEqual(istag("ti=tle"), false);
  });
  it("less", function() {
    assert.strictEqual(istag("ti\x19tle"), false);
  });
  it("greater", function() {
    assert.strictEqual(istag("ti\xa0tle"), false);
  });
  it("simple", function() {
    assert.strictEqual(istag("title"), true);
  });
  it("space", function() {
    assert.strictEqual(istag("ti tle"), true);
  });
  it("ugly", function() {
    assert.strictEqual(istag("!{}[]-_()*&"), true);
  });
});

describe("VComment", function() {
  var c;
  before(function() {
    c = new VComment();
    c.append(["artist", "piman"]);
    c.append(["artist", "mu"]);
    c.append(["title", "more fakes"]);
  });
  it.skip("invalid_init", function() {
    //def test_invalid_init.skip(self):
    //    self.failUnlessRaises(TypeError, VComment, [])
  });
  it.skip("equal", function() {
    //def test_equal(self):
    //    self.failUnlessEqual(self.c, self.c)
  });
  it.skip("not_header", function() {
    //def test_not_header(self):
    //    self.failUnlessRaises(IOError, VComment, "foo")
  });
  it.skip("unset_framing_bit", function() {
    //def test_unset_framing_bit.skip(self):
    //    self.failUnlessRaises(
    //        IOError, VComment, "\x00\x00\x00\x00" * 2 + "\x00")
  });
  it.skip("empty_valid", function() {
    //def test_empty_valid(self):
    //    self.failIf(VComment("\x00\x00\x00\x00" * 2 + "\x01"))
  });
  it.skip("validate", function() {
    //def test_validate(self):
    //    self.failUnless(self.c.validate())
  });
  it.skip("validate_broken_key", function() {
    //def test_validate_broken_key(self):
    //    self.c.append((1, u"valid"))
    //    self.failUnlessRaises(ValueError, self.c.validate)
    //    self.failUnlessRaises(ValueError, self.c.write)
  });
  it.skip("validate_broken_value", function() {
    //def test_validate_broken_value(self):
    //    self.c.append(("valid", 1))
    //    self.failUnlessRaises(ValueError, self.c.validate)
    //    self.failUnlessRaises(ValueError, self.c.write)
  });
  it.skip("validate_nonunicode_value", function() {
    //def test_validate_nonunicode_value(self):
    //    self.c.append(("valid", "wt\xff"))
    //    self.failUnlessRaises(ValueError, self.c.validate)
    //    self.failUnlessRaises(ValueError, self.c.write)
  });
  it.skip("vendor_default", function() {
    //def test_vendor_default(self):
    //    self.failUnless(self.c.vendor.startswith("Mutagen"))
  });
  it.skip("vendor_set", function() {
    //def test_vendor_set(self):
    //    self.c.vendor = "Not Mutagen"
    //    self.failUnless(self.c.write()[4:].startswith("Not Mutagen"))
  });
  it.skip("vendor_invalid", function() {
    //def test_vendor_invalid(self):
    //    self.c.vendor = "\xffNot Mutagen"
    //    self.failUnlessRaises(ValueError, self.c.validate)
    //    self.failUnlessRaises(ValueError, self.c.write)
  });
  it.skip("invalid_format_strict", function() {
    //def test_invalid_format_strict(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x03\x00\x00'
    //            '\x00abc\x01')
    //    self.failUnlessRaises(IOError, VComment, data, errors='strict')
  });
  it.skip("invalid_format_replace", function() {
    //def test_invalid_format_replace(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x03\x00\x00'
    //            '\x00abc\x01')
    //    comment = VComment(data)
    //    self.failUnlessEqual("abc", comment[0][1])
  });
  it.skip("invalid_format_ignore", function() {
    //def test_invalid_format_ignore(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x03\x00\x00'
    //            '\x00abc\x01')
    //    comment = VComment(data, errors='ignore')
    //    self.failIf(len(comment))
  });
  it.skip("invalid_tag_strict", function() {
    //# Slightly different test data than above, we want the tag name
    //# to be valid UTF-8 but not valid ASCII.
    //def test_invalid_tag_strict(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x04\x00\x00'
    //            '\x00\xc2\xaa=c\x01')
    //    self.failUnlessRaises(IOError, VComment, data, errors='strict')
  });
  it.skip("invalid_tag_replace", function() {
    //def test_invalid_tag_replace(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x04\x00\x00'
    //            '\x00\xc2\xaa=c\x01')
    //    comment = VComment(data)
    //    self.failUnlessEqual("?=c", comment.pprint())
  });
  it.skip("invalid_tag_ignore", function() {
    //def test_invalid_tag_ignore(self):
    //    data = ('\x07\x00\x00\x00Mutagen\x01\x00\x00\x00\x04\x00\x00'
    //            '\x00\xc2\xaa=c\x01')
    //    comment = VComment(data, errors='ignore')
    //    self.failIf(len(comment))
  });
  it.skip("roundtrip", function() {
    //def test_roundtrip(self):
    //    self.failUnlessEqual(self.c, VComment(self.c.write()))
  });
});

describe("VCommentDict", function() {
  var Kind = VCommentDict;
  var c;

  before(function() {
    c = new Kind();
    c.setItem("artist", ["mu", "piman"]);
    c.setItem("title", "more fakes");
  });
  it.skip("correct_len", function() {
    //def test_correct_len(self):
    //    self.failUnlessEqual(len(self.c), 3)
  });
  it.skip("keys", function() {
    //def test_keys(self):
    //    self.failUnless("artist" in self.c.keys())
    //    self.failUnless("title" in self.c.keys())
  });
  it.skip("values", function() {
    //def test_values(self):
    //    self.failUnless(["mu", "piman"] in self.c.values())
    //    self.failUnless(["more fakes"] in self.c.values())
  });
  it.skip("items", function() {
    //def test_items(self):
    //    self.failUnless(("artist", ["mu", "piman"]) in self.c.items())
    //    self.failUnless(("title", ["more fakes"]) in self.c.items())
  });
  it.skip("equal", function() {
    //def test_equal(self):
    //    self.failUnlessEqual(self.c, self.c)
  });
  it.skip("get", function() {
    //def test_get(self):
    //    self.failUnlessEqual(self.c["artist"], ["mu", "piman"])
    //    self.failUnlessEqual(self.c["title"], ["more fakes"])
  });
  it.skip("set", function() {
    //def test_set(self):
    //    self.c["woo"] = "bar"
    //    self.failUnlessEqual(self.c["woo"], ["bar"])
  });
  it.skip("del", function() {
    //def test_del(self):
    //    del(self.c["title"])
    //    self.failUnlessRaises(KeyError, self.c.__getitem__, "title")
  });
  it.skip("contains", function() {
    //def test_contains(self):
    //    self.failIf("foo" in self.c)
    //    self.failUnless("title" in self.c)
  });
  it.skip("get_case", function() {
    //def test_get_case(self):
    //    self.failUnlessEqual(self.c["ARTIST"], ["mu", "piman"])
  });
  it.skip("set_case", function() {
    //def test_set_case(self):
    //    self.c["TITLE"] = "another fake"
    //    self.failUnlessEqual(self.c["title"], ["another fake"])
  });
  it.skip("contains_case", function() {
    //def test_contains_case(self):
    //    self.failUnless("TITLE" in self.c)
  });
  it.skip("del_case", function() {
    //def test_del_case(self):
    //    del(self.c["TITLE"])
    //    self.failUnlessRaises(KeyError, self.c.__getitem__, "title")
  });
  it.skip("get_failure", function() {
    //def test_get_failure(self):
    //    self.failUnlessRaises(KeyError, self.c.__getitem__, "woo")
  });
  it.skip("del_failure", function() {
    //def test_del_failure(self):
    //    self.failUnlessRaises(KeyError, self.c.__delitem__, "woo")
  });
  it.skip("roundtrip", function() {
    //def test_roundtrip(self):
    //    self.failUnlessEqual(self.c, self.Kind(self.c.write()))
  });
  it.skip("roundtrip_vc", function() {
    //def test_roundtrip_vc(self):
    //    self.failUnlessEqual(self.c, VComment(self.c.write()))
  });
  it.skip("case_items_426", function() {
    //def test_case_items_426(self):
    //    self.c.append(("WOO", "bar"))
    //    self.failUnless(("woo", ["bar"]) in self.c.items())
  });
  it.skip("empty", function() {
    //def test_empty(self):
    //    self.c = VCommentDict()
    //    self.failIf(self.c.keys())
    //    self.failIf(self.c.values())
    //    self.failIf(self.c.items())
  });
  it.skip("as_dict", function() {
    //def test_as_dict(self):
    //    d = self.c.as_dict()
    //    self.failUnless("artist" in d)
    //    self.failUnless("title" in d)
    //    self.failUnlessEqual(d["artist"], self.c["artist"])
    //    self.failUnlessEqual(d["title"], self.c["title"])
  });
  it.skip("bad_key", function() {
    //def test_bad_key(self):
    //    self.failUnlessRaises(UnicodeError, self.c.get, u"\u1234")
    //    self.failUnlessRaises(
    //        UnicodeError, self.c.__setitem__, u"\u1234", "foo")
    //    self.failUnlessRaises(
    //        UnicodeError, self.c.__delitem__, u"\u1234")
  });
  it.skip("duplicate_keys", function() {
    //def test_duplicate_keys(self):
    //    self.c = VCommentDict()
    //    keys = ("key", "Key", "KEY")
    //    for key in keys:
    //        self.c.append((key, "value"))
    //    self.failUnlessEqual(len(self.c.keys()), 1)
    //    self.failUnlessEqual(len(self.c.as_dict()), 1)
  });
});
