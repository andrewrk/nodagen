// mutagen aims to be an all purpose media tagging library
// Copyright (C) 2005  Michael Urman
// Copyright (C) 2013  Andrew Kelley
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of version 2 of the GNU General Public License as
// published by the Free Software Foundation.
//
//
// Mutagen aims to be an all purpose tagging library.
//
// ::
//
//     import mutagen.[format]
//     metadata = mutagen.[format].Open(filename)
//
// metadata acts like a dictionary of tags in the file. Tags are generally a
// list of string-like values, but may have additional methods available
// depending on tag or format. They may also be entirely different objects
// for certain keys, again depending on format.

var packageJson = require('../package.json')
  , assert = require('assert')
  , fs = require('fs')
  // TODO uncomment when finished porting
  //, mp3 = require('./mp3')
  //, trueaudio = require('./trueaudio')
  //, oggtheora = require('./oggtheora')
  //, oggspeex = require('./oggspeex')
  //, oggvorbis = require('./oggvorbis')
  //, oggflac = require('./oggflac')
  //, flac = require('./flac')
  , apev2 = require('./apev2')
  //, easymp4 = require('./easymp4')
  //, mp4 = require('./mp4')
  //, easyid3 = require('./easyid3')
  //, id3 = require('./id3')
  , wavpack = require('./wavpack')
  //, musepack = require('./musepack')
  //, monkeysaudio = require('./monkeysaudio')
  //, optimfrog = require('./optimfrog')
  //, asf = require('./asf')
  //, oggopus = require('./oggopus')

module.exports = {
  version: packageJson.version,
  Metadata: require('./metadata'),
  FileType: require('./file_type'),
  file: file,

  // TODO uncomment when finished porting
  //mp3: mp3,
  //trueaudio: trueaudio,
  //oggtheora: oggtheora,
  //oggspeex: oggspeex,
  //oggvorbis: oggvorbis,
  //flac: flac,
  apev2: apev2,
  //easymp4: easymp4,
  //mp4: mp4,
  //easyid3: easyid3,
  //id3: id3,
  wavpack: wavpack,
  //musepack: musepack,
  //monkeysaudio: monkeysaudio,
  //optimfrog: optimfrog,
  //asf: asf,
  //oggopus: oggopus,
};

function file(filename, o) {
  // Guess the type of the file and try to open it.

  // The file type is decided by several things, such as the first 128
  // bytes (which usually contains a file type identifier), the
  // filename extension, and the presence of existing tags.

  // If no appropriate type could be found, None is returned.

  o = o || {};
  var options = o.options || null;
  var easy = o.easy == null ? false : o.easy;

  if (options == null) {
    // TODO: uncomment these when they are finished being ported
    options = [
      //easy ? mp3.EasyMP3 : mp3.MP3,
      //easy ? trueaudio.EasyTrueAudio : trueaudio.TrueAudio,
      //oggtheora.OggTheora,
      //oggspeex.OggSpeex,
      //oggvorbis.OggVorbis,
      //oggflac.OggFLAC,
      //flac.FLAC,
      apev2.APEv2File,
      //easy ? easymp4.EasyMP4 : mp4.MP4,
      //easy ? easyid3.EasyID3FileType : id3.ID3FileType,
      wavpack.WavPack,
      //musepack.Musepack,
      //monkeysaudio.MonkeysAudio,
      //optimfrog.OptimFROG,
      //asf.ASF,
      //oggopus.OggOpus,
    ];
  }
  if (! options) return null;

  // TODO - async
  var fileobj = fs.openSync(filename, "r");
  var results;
  try {
    var header = new Buffer(128);
    fs.readSync(fileobj, header, 0, 128, 0);
    // Sort by name after score. Otherwise import order affects
    // Kind sort order, which affects treatment of things with
    // equal scores.
    results = options.map(function(Kind) {
      // TODO - make sure all the Kinds have name instead of __name__
      return [Kind.score(filename, fileobj, header), Kind.name, Kind];
    });
  } finally {
    fs.closeSync(fileobj);
  }
  results.sort();
  var bestResult = results[results.length - 1]
    , score = bestResult[0]
    , Kind = bestResult[2];
  return score > 0 ? new Kind(filename) : null;
}
