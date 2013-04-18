var path = require('path')
  , data = path.join(__dirname, "data")
  , assert = require('assert')
  , WavPack = require('../').WavPack

describe("WavPack", function() {
  var audio = null;
  before(function(done) {
    audio = new WavPack(path.join(data, "silence-44-s.wv"));
  });
  it("channels", function() {
    assert.strictEqual(audio.info.channels, 2);
  });
  it("sample rate", function() {
    assert.strictEqual(audio.info.sample_rate, 44100);
  });
  it("length", function() {
    assertAlmostEqual(audio.info.length, 3.68, 2);
  });
  it("not my file", function() {
    assert.throws(function() {
      var audio2 = new WavPack(path.join(data, "empty.ogg"));
    }, /IOError/);
  });
  it("pprint", function() {
    assert.strictEqual(audio.pprint(), "foo");
  });
  it("mime", function() {
    assert.ok(audio.mime.indexOf("audio/x-wavpack") >= 0);
  });
});

function assertAlmostEqual(actual, expected, places) {
  actual = Math.round(actual / (10 * places)) / (10 * places);
  expected = Math.round(expected / (10 * places)) / (10 * places);
  assert.strictEqual(actual, expected);
}
