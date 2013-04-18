// A WavPack reader/tagger
//
// Copyright 2006 Joe Wreschnig
// Copyright 2013 Andrew Kelley
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.
//
//
// WavPack reading and writing.
//
// WavPack is a lossless format that uses APEv2 tags. Read
// http://www.wavpack.com/ for more information.

var apev2 = require('./apev2')
  , AbstractError = require('./abstract_error')
  , APEv2File = apev2.APEv2File
  , fs = require('fs')
  , util = require('util');

module.exports = {
  WavPack: WavPack,
  delete: apev2.delete,
};

util.inherits(WavPackHeaderError, AbstractError);
function WavPackHeaderError() {
  AbstractError.apply(this, arguments);
}

var RATES = [6000, 8000, 9600, 11025, 12000, 16000, 22050, 24000, 32000, 44100,
         48000, 64000, 88200, 96000, 192000];

// WavPack stream information.
//
// Attributes:
//
// * channels - number of audio channels (1 or 2)
// * length - file length in seconds, as a float
// * sample_rate - audio sampling rate in Hz
// * version - WavPack stream version
function WavPackInfo(fileobj) {
  var header = new Buffer(28);
  var readCount = fs.readSync(fileobj, header, 0, 28, 0);
  if (readCount !== 28 || header.toString('ascii', 0, 4) !== 'wvpk') {
    throw new WavPackHeaderError("not a WavPack file");
  }
  var samples = header.readUInt32LE(12);
  var flags = header.readUInt32LE(24);

  this.version = header.readInt16LE(8);
  this.channels = !!(flags & 4) || 2;
  this.sample_rate = RATES[(flags >> 23) & 0xF];
  this.length = samples / this.sample_rate;
}

WavPackInfo.prototype.pprint = function() {
  return "WavPack, " + this.length + " seconds, " + this.sample_rate + " Hz";
};

util.inherits(WavPack, APEv2File);
function WavPack() {
  APEv2File.apply(this, arguments);
  this._mimes.push("audio/x-wavpack");
}

WavPack.prototype._Info = WavPackInfo;

WavPack.score = function(filename, fileobj, header) {
  return (header.toString('ascii', 0, 4) === 'wvpk') * 2;
};
