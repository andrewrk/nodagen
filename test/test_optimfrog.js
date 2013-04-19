var path = require('path')
  , data = path.join(__dirname, "data")
  , assert = require('assert')
  , optimfrog = require('../').optimfrog
  , OptimFROG = optimfrog.OptimFROG

describe("OptimFROG", function() {
  var ofr, ofs;
  before(function() {
    ofr = new OptimFROG(path.join(data, "empty.ofr"));
    ofs = new OptimFROG(path.join(data, "empty.ofs"));
  });
  it("channels", function() {
    assert.strictEqual(ofr.info.channels, 2);
    assert.strictEqual(ofs.info.channels, 2);
  });
  it("sample_rate", function() {
    assert.strictEqual(ofr.info.sample_rate, 44100);
    assert.strictEqual(ofs.info.sample_rate, 44100);
  });
  it("length", function() {
    assertAlmostEqual(ofr.info.length, 3.68, 2);
    assertAlmostEqual(ofs.info.length, 3.68, 2);
  });
  it("not_my_file", function() {
    assert.throws(function() {
      var x = new OptimFROG(path.join(data, "empty.ogg"));
    }, /not an OptimFROG file/);
    assert.throws(function() {
      var x = new OptimFROG(path.join(data, "click.mpc"));
    }, /not an OptimFROG file/);
  });
  it("pprint", function() {
    assert.strictEqual(ofr.pprint(),
      "OptimFROG, 3.68 seconds, 44100 Hz (application/octet-stream)");
    assert.strictEqual(ofs.pprint(),
      "OptimFROG, 3.68 seconds, 44100 Hz (application/octet-stream)");
  });
});
function assertAlmostEqual(actual, expected, places) {
  actual = Math.round(actual / (10 * places)) / (10 * places);
  expected = Math.round(expected / (10 * places)) / (10 * places);
  assert.strictEqual(actual, expected);
}
