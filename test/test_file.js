var nodagen = require('../')
  , file = nodagen.file
  , path = require('path')
  , assert = require('assert')
  , fs = require('fs')
  , data = path.join(__dirname, "data")
  , Batch = require('batch')
  , temp = require('temp')
  , ncp = require('ncp')
  , APEv2File = nodagen.apev2.APEv2File
  , WavPack = nodagen.wavpack.WavPack
  // TODO uncomment when implemented
  , OptimFROG = nodagen.optimfrog.OptimFROG
  //, Musepack = nodagen.musepack.Musepack
  //, ASF = nodagen.asf.ASF
  //, MP4 = nodagen.mp4.MP4
  //, FLAC = nodagen.flac.FLAC

describe("File", function() {
  it("bad", function() {
    assert.equal(file("/dev/null"), null);
    assert.equal(file(__filename), null);
  });
  it("empty", function() {
    var filename = path.join(data, "empty");
    var fd = fs.openSync(filename, "w");
    fs.closeSync(fd);
    try {
      assert.equal(file(filename), null);
    } finally {
      fs.unlinkSync(filename);
    }
  });
  it("not_file", function() {
    assert.throws(function() {
      var x = file("/dev/doesnotexist");
    }, /ENOENT/);
  });
  it("no_options", function() {
    var opts = ["empty.ogg", "empty.oggflac", "silence-44-s.mp3"];
    opts.forEach(function(filename) {
      filename = path.join(data, filename);
      assert.equal(file(filename, { options: [] }), null);
    });
  });
  it.skip("oggvorbis", function() {
    //def test_oggvorbis(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "empty.ogg")), OggVorbis))
  });
  it.skip("oggflac", function() {
    //def test_oggflac(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "empty.oggflac")), OggFLAC))
  });
  it.skip("oggspeex", function() {
    //def test_oggspeex(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "empty.spx")), OggSpeex))
  });
  it.skip("oggtheora", function() {
    //def test_oggtheora(self):
    //    self.failUnless(isinstance(File(
    //        os.path.join("tests", "data", "sample.oggtheora")), OggTheora))
  });
  it.skip("oggopus", function() {
    //def test_oggopus(self):
    //    self.failUnless(isinstance(File(
    //        os.path.join("tests", "data", "example.opus")), OggOpus))
  });
  it.skip("mp3", function() {
    //def test_mp3(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "bad-xing.mp3")), MP3))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "xing.mp3")), MP3))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-44-s.mp3")), MP3))
  });
  it.skip("easy_mp3", function() {
    //def test_easy_mp3(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-44-s.mp3"), easy=True),
    //        EasyMP3))
  });
  it.skip("flac", function() {
    //def test_flac(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-44-s.flac")), FLAC))
  });
  it.skip("musepack", function() {
    //def test_musepack(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "click.mpc")), Musepack))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "sv4_header.mpc")), Musepack))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "sv5_header.mpc")), Musepack))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "sv8_header.mpc")), Musepack))
  });
  it.skip("monkeysaudio", function() {
    //def test_monkeysaudio(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "mac-399.ape")), MonkeysAudio))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "mac-396.ape")), MonkeysAudio))
  });
  it("apev2", function() {
    assert.ok(file(path.join(data, "oldtag.apev2")) instanceof APEv2File);
  });
  it.skip("tta", function() {
    //def test_tta(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "empty.tta")), TrueAudio))
  });
  it.skip("easy_tta", function() {
    //def test_easy_tta(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "empty.tta"), easy=True),
    //        EasyTrueAudio))
  });
  it("wavpack", function() {
    assert.ok(file(path.join(data, "silence-44-s.wv")) instanceof WavPack);
  });
  it.skip("mp4", function() {
    //def test_mp4(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "has-tags.m4a")), MP4))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "no-tags.m4a")), MP4))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "no-tags.3g2")), MP4))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "truncated-64bit.mp4")), MP4))
  });
  it("optimfrog", function() {
    assert.ok(file(path.join(data, "empty.ofr")) instanceof OptimFROG);
    assert.ok(file(path.join(data, "empty.ofs")) instanceof OptimFROG);
  });
  it.skip("asf", function() {
    //def test_asf(self):
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-1.wma")), ASF))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-2.wma")), ASF))
    //    self.failUnless(isinstance(
    //        File(os.path.join("tests", "data", "silence-3.wma")), ASF))
  });
  it.skip("id3_indicates_mp3_not_tta", function() {
    //def test_id3_indicates_mp3_not_tta(self):
    //    header = "ID3 the rest of this is garbage"
    //    fileobj = StringIO(header)
    //    filename = "not-identifiable.ext"
    //    self.failUnless(TrueAudio.score(filename, fileobj, header) <
    //                    MP3.score(filename, fileobj, header))
  });
});
describe("FileUpperExt", function() {
  var FILES = [
  // TODO- uncomment when implemented
    //[path.join(data, "empty.ofr"), OptimFROG],
    //[path.join(data, "sv5_header.mpc"), Musepack],
    //[path.join(data, "silence-3.wma"), ASF],
    //[path.join(data, "truncated-64bit.mp4"), MP4],
    //[path.join(data, "silence-44-s.flac"), FLAC],
  ];
  var checks;
  beforeEach(function(done) {
    checks = [];
    var batch = new Batch();
    FILES.forEach(function(item) {
      var original = item[0]
        , instance = item[1];
      var ext = path.extname(original);
      var filename = temp.path({suffix: ext.toUpperCase()});
      batch.push(function(done) {
        ncp(original, filename, function(err) {
          if (err) return done(err);
          checks.push([filename, instance]);
          done();
        });
      });
    });
    batch.end(done);
  });
  afterEach(function() {
    checks.forEach(function(item) {
      fs.unlinkSync(item[0]);
    });
  });
  it.skip("case_insensitive_ext", function() {
    checks.forEach(function(item) {
      var path = item[0]
        , instance = item[1];
      var f = nodagen.file(path, {options: [instance]});
      assert.ok(f instanceof instance);
    });
  });
});
