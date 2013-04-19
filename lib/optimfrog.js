// OptimFROG reader/tagger
//
// Copyright 2006 Lukas Lalinsky <lalinsky@gmail.com>
// Copyright 2013 Andrew Kelley <superjoe30@gmail.com>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.

// OptimFROG audio streams with APEv2 tags.
//
// OptimFROG is a lossless audio compression program. Its main goal is to
// reduce at maximum the size of audio files, while permitting bit
// identical restoration for all input. It is similar with the ZIP
// compression, but it is highly specialized to compress audio data.
//
// Only versions 4.5 and higher are supported.
//
// For more information, see http://www.losslessaudio.org/

var apev2 = require('./apev2')
  , AbstractError = require('./abstract_error')
  , APEv2File = apev2.APEv2File
  , fs = require('fs')
  , util = require('util');

module.exports = {
  OptimFROG: OptimFROG,
  delete: apev2.delete,
};

util.inherits(OptimFROGHeaderError, AbstractError);
function OptimFROGHeaderError() {
  AbstractError.apply(this, arguments);
}


// OptimFROG stream information.
// 
// Attributes:
// 
// * channels - number of audio channels
// * length - file length in seconds, as a float
// * sample_rate - audio sampling rate in Hz
function OptimFROGInfo(fileobj) {
  var header = new Buffer(76);
  var readCount = fs.readSync(fileobj, header, 0, header.length, 0);
  var ok = true;
  ok = ok && readCount === header.length;
  ok = ok && header.toString('binary', 0, 4) === 'OFR ';
  if (ok) {
    var magicNumber = header.readUInt32LE(4);
    ok = magicNumber === 12 || magicNumber === 15;
  }
  if (!ok) throw new OptimFROGHeaderError("not an OptimFROG file");
  var total_samples = header.readUInt32LE(8);
  var total_samples_high = header.readUInt16LE(12);
  var sample_type = header.readUInt8(14);
  this.channels = header.readUInt8(15);
  this.sample_rate = header.readUInt32LE(16);
  total_samples += (total_samples_high << 32) >>> 0;
  this.channels += 1;
  if (this.sample_rate) {
    this.length = total_samples / (this.channels * this.sample_rate);
  } else {
    this.length = 0;
  }
}
OptimFROGInfo.prototype.pprint = function() {
  var roundedLength = Math.round(this.length * 100) / 100;
  return "OptimFROG, " + roundedLength + " seconds, " +
    this.sample_rate + " Hz";
};

util.inherits(OptimFROG, APEv2File);
function OptimFROG() {
  APEv2File.apply(this, arguments);
}
OptimFROG.prototype._Info = OptimFROGInfo;

OptimFROG.score = function(filename, fileobj, header) {
  return (header.toString('binary', 0, 3) === 'OFR') +
    /\.of[rs]$/i.test(filename);
};
