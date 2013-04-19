var path = require('path')
  , data = path.join(__dirname, "data")
  , assert = require('assert')
  , wavpack = require('../').wavpack
  , WavPack = wavpack.WavPack

describe("WavPack", function() {
  var audio = null;
  beforeEach(function() {
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
    }, /not a WavPack file/);
  });
  it("pprint", function() {
    assert.strictEqual(audio.pprint(), 'WavPack, 3.68 seconds, 44100 Hz (audio/x-wavpack)\nAlbum=Quod Libet Test Data\nArtist=piman / jzig\nDate=2004\nGenre=Silence\nReplaygain_Album_Gain=+9.27 dB\nReplaygain_Album_Peak=0.229712820826\nReplaygain_Track_Gain=+9.27 dB\nReplaygain_Track_Peak=0.229712820826\nTitle=Silence\nTrack=02/10');
  });
  it("mime", function() {
    assert.ok(audio.mime().indexOf("audio/x-wavpack") >= 0);
  });
});

function assertAlmostEqual(actual, expected, places) {
  actual = Math.round(actual / (10 * places)) / (10 * places);
  expected = Math.round(expected / (10 * places)) / (10 * places);
  assert.strictEqual(actual, expected);
}
