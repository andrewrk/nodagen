// An APEv2 tag reader
//
// Copyright 2005 Joe Wreschnig
// Copyright 2013 Andrew Kelley
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.

// APEv2 reading and writing.
//
// The APEv2 format is most commonly used with Musepack files, but is
// also the format of choice for WavPack and other formats. Some MP3s
// also have APEv2 tags, but this can cause problems with many MP3
// decoders and taggers.
//
// APEv2 tags, like Vorbis comments, are freeform key=value pairs. APEv2
// keys can be any ASCII string with characters from 0x20 to 0x7E,
// between 2 and 255 characters long.  Keys are case-sensitive, but
// readers are recommended to be case insensitive, and it is forbidden to
// multiple keys which differ only in case.  Keys are usually stored
// title-cased (e.g. 'Artist' rather than 'artist').
//
// APEv2 values are slightly more structured than Vorbis comments; values
// are flagged as one of text, binary, or an external reference (usually
// a URI).
//
// Based off the format specification found at
// http://wiki.hydrogenaudio.org/index.php?title=APEv2_specification.

module.exports = {
  APEv2: APEv2,
  APEv2File: APEv2File,
  Open: APEv2,
  delete: _delete,
};

var fs = require('fs')
  , assert = require('assert')
  , KeyError = require('./key_error')
  , util = require('util')
  , Metadata = require('./metadata')
  , FileType = require('./file_type')
  , DictMixin = require('./dict_mixin')
  , delete_bytes = require('./_util').deleteBytesSync;

var INVALID_KEYS = {
  'OggS': true,
  'TAG': true,
  'ID3': true,
  'MP+': true,
};

// There are three different kinds of APE tag values.
// "0: Item contains text information coded in UTF-8
//  1: Item contains binary information
//  2: Item is a locator of external stored information [e.g. URL]
//  3: reserved"
var TEXT = 0
  , BINARY = 1
  , EXTERNAL = 2;

var HAS_HEADER = 1 << 31;
var HAS_NO_FOOTER = 1 << 30;
var IS_HEADER  = 1 << 29;

// TODO - delete this?
//class error(IOError): pass

util.inherits(APENoHeaderError, Error);
function APENoHeaderError() {
  Error.apply(this, arguments);
  this.name = "APENoHeaderError";
}

util.inherits(APEUnsupportedVersionError, Error);
function APEUnsupportedVersionError() {
  Error.apply(this, arguments);
  this.name = "APEUnsupportedVersionError";
}

util.inherits(APEBadItemError, Error);
function APEBadItemError(message) {
  Error.apply(this, arguments);
  this.name = "APEBadItemError";
}

function _APEv2Data(fileobj) {
  // Store offsets of the important parts of the file.
  this.start = this.header = this.data = this.footer = this.end = null
  // Footer or header; seek here and read 32 to get version/size/items/flags
  this.metadata = null
  // Actual tag data
  this.tag = null

  this.version = null;
  this.size = null;
  this.items = null;
  this.flags = 0;

  // The tag is at the start rather than the end. A tag at both
  // the start and end of the file (i.e. the tag is the whole file)
  // is not considered to be at the start.
  this.is_at_start = false;

  // TODO - async
  this.fileobj_seek = 0; // TODO - update this when reading from fileobj
  this.__find_metadata(fileobj);
  this.metadata = maxNumber(this.header, this.footer);
  if (this.metadata == null) return;
  this.__fill_missing(fileobj);
  this.__fix_brokenness(fileobj);
  if (this.data != null) {
    this.fileobj_seek = this.data;
    this.tag = new Buffer(this.size);
    this.fileobj_seek += fs.readSync(fileobj, this.tag, 0, this.size, this.fileobj_seek);
  }
}

_APEv2Data.prototype.__find_metadata = function(fileobj) {
  // Try to find a header or footer.
  // Check for a simple footer.
  var stats = fs.fstatSync(fileobj);
  this.fileobj_seek = stats.size - 32;
  if (this.fileobj_seek < 0) {
    this.fileobj_seek = stats.size;
    return;
  }
  var buf = new Buffer(9);
  this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
  if (buf.toString('ascii', 0, 8) === 'APETAGEX') {
    this.fileobj_seek -= 8;
    this.footer = this.metadata = this.fileobj_seek;
    return;
  }

  // Check for an APEv2 tag followed by an ID3v1 tag at the end.
  this.fileobj_seek = stats.size - 128;
  this.fileobj_seek += fs.readSync(fileobj, buf, 0, 3, this.fileobj_seek);
  if (buf.toString('ascii', 0, 3) === "TAG") {
    this.fileobj_seek -= 35; // "TAG" + header length
    this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
    if (buf.toString('ascii', 0, 8) === "APETAGEX") {
      this.fileobj_seek -= 8;
      this.footer = this.fileobj_seek;
      return;
    }
    // ID3v1 tag at the end, maybe preceded by Lyrics3v2.
    // (http://www.id3.org/lyrics3200.html)
    // (header length - "APETAGEX") - "LYRICS200"
    this.fileobj_seek += 15;
    this.fileobj_seek += fs.readSync(fileobj, buf, 0, 9, this.fileobj_seek);
    if (buf.toString('ascii', 0, 9) === 'LYRICS200') {
      this.fileobj_seek -= 15; // "LYRICS200" + size tag
      this.fileobj_seek += fs.readSync(fileobj, buf, 0, 6, this.fileobj_seek);
      var offset = parseInt(buf.toString('ascii', 0, 6), 10);
      if (offset !== 0 && ! isNaN(offset)) {
        this.fileobj_seek += -32 - offset - 6;
        this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
        if (buf.toString('ascii', 0, 8) === 'APETAGEX') {
          this.fileobj_seek -= 8;
          this.footer = this.fileobj_seek;
          return;
        }
      }
    }
  }

  // Check for a tag at the start.
  this.fileobj_seek = 0;
  this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
  if (buf.toString('ascii', 0, 8) === 'APETAGEX') {
    this.is_at_start = true;
    this.header = 0;
  }
};

_APEv2Data.prototype.__fill_missing = function(fileobj) {
  this.fileobj_seek = this.metadata + 8;
  this.version = new Buffer(4);
  this.fileobj_seek += fs.readSync(fileobj, this.version, 0, 4, this.fileobj_seek);
  var buf = new Buffer(12);
  this.fileobj_seek += fs.readSync(fileobj, buf, 0, 12, this.fileobj_seek);
  this.size = buf.readUInt32LE(0);
  this.items = buf.readUInt32LE(4);
  this.flags = buf.readUInt32LE(8);

  if (this.header != null) {
    this.data = this.header + 32;
    // If we're reading the header, the size is the header
    // offset + the size, which includes the footer.
    this.end = this.data + this.size;
    this.fileobj_seek = this.end - 32;
    this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
    if (buf.toString('ascii', 0, 8) === "APETAGEX") {
      this.footer = this.end - 32;
    }
  } else if (this.footer != null) {
    this.end = this.footer + 32;
    this.data = this.end - this.size;
    if (this.flags & HAS_HEADER) {
      this.header = this.data - 32;
    } else {
      this.header = this.data;
    }
  } else {
    throw new APENoHeaderError("No APE tag found");
  }
};

_APEv2Data.prototype.__fix_brokenness = function(fileobj) {
  // Fix broken tags written with PyMusepack.
  var start = this.header != null ? this.header : this.data;
  this.fileobj_seek = start;

  var buf = new Buffer(8);
  while (start > 0) {
    // Clean up broken writing from pre-Mutagen PyMusepack.
    // It didn't remove the first 24 bytes of header.
    this.fileobj_seek -= 24;
    if (this.fileobj_seek < 0) break;
    this.fileobj_seek += fs.readSync(fileobj, buf, 0, 8, this.fileobj_seek);
    if (buf.toString('ascii') === "APETAGEX") {
      this.fileobj_seek -= 8;
      start = this.fileobj_seek;
    } else {
      break;
    }
  }
  this.start = start;
};

// A file with an APEv2 tag.
// ID3v1 tags are silently ignored and overwritten.
util.inherits(APEv2, Metadata);
Object.keys(DictMixin.prototype).forEach(function(method) {
  assert.ok(!APEv2.prototype[method]);
  APEv2.prototype[method] = DictMixin.prototype[method];
});

function APEv2() {
  this.filename = null;
  this.__casemap = {}
  this.__dict = {}
  Metadata.apply(this, arguments)
  // Internally all names are stored as lowercase, but the case
  // they were set with is remembered and used when saving.  This
  // is roughly in line with the standard, which says that keys
  // are case-sensitive but two keys differing only in case are
  // not allowed, and recommends case-insensitive
  // implementations.
}

// Return tag key=value pairs in a human-readable format.
APEv2.prototype.pprint = function() {
  var items = this.items();
  items.sort();
  return items.map(function(item) {
    var k = item[0],
        v = item[1];
    return k + "=" + v.pprint();
  }).join("\n");
};

APEv2.prototype.load = function(filename) {
  // Load tags from a filename.
  this.filename = filename;
  var fileobj = fs.openSync(filename, 'r');

  var data;
  try {
    data = new _APEv2Data(fileobj);
  } finally {
    fileobj.close();
  }
  if (data.tag) {
    this.clear()
    this.__casemap.clear()
    this.__parse_tag(data.tag, data.items)
  } else {
    throw new APENoHeaderError("No APE tag found");
  }
};

APEv2.prototype.__parse_tag = function(tag, count) {
  var offset = 0;
  for (var i = 0; i < count; ++i) {
    var size = tag.readUInt32LE(offset); offset += 4;
    var flags = tag.readUInt32LE(offset); offset += 4;

    // Bits 1 and 2 bits are flags, 0-3
    // Bit 0 is read/write flag, ignored
    var kind = (flags & 6) >> 1;
    if (kind === 3) throw new APEBadItemError("value type must be 0, 1, or 2");
    // TODO: make a buffer, not a string, so we properly decode unicode
    var value = tag.toString('ascii', offset, offset += 1);
    var key = value;
    while (key[key.length - 1] !== '\x00' && value) {
      value = tag.toString('ascii', offset, offset += 1);
      key += value;
    }
    if (key[key.length - 1] === "\x00") {
      key = key.substring(0, key.length - 1);
    }
    value = tag.toString('ascii', offset, offset += size);
    this.setItem(key, new APEValue(value, kind));
  }
};

// TODO - look for instances of using as dict and replace with these methods
APEv2.prototype.getItem = function(key) {
  if (! is_valid_apev2_key(key)) {
    throw new KeyError(key + " is not a valid APEv2 key");
  }
  // TODO wtf is this shit?
  // key = key.encode('ascii')

  return this.__dict[key.toLowerCase()];
};

APEv2.prototype.delItem = function(key) {
  if (! is_valid_apev2_key(key)) {
    throw new KeyError(key + " is not a valid APEv2 key");
  }
  // TODO wtf is this shit?
  // key = key.encode('ascii')

  delete this.__dict[key.toLowerCase()];
};

APEv2.prototype.setItem = function(key, value) {
  // 'Magic' value setter.

  // This function tries to guess at what kind of value you want to
  // store. If you pass in a valid UTF-8 or Unicode string, it
  // treats it as a text value. If you pass in a list, it treats it
  // as a list of string/Unicode values.  If you pass in a string
  // that is not valid UTF-8, it assumes it is a binary value.

  // If you need to force a specific type of value (e.g. binary
  // data that also happens to be valid UTF-8, or an external
  // reference), use the APEValue factory and set the value to the
  // result of that::

  //     from mutagen.apev2 import APEValue, EXTERNAL
  //     tag['Website'] = APEValue('http://example.org', EXTERNAL)

  if (! is_valid_apev2_key(key)) {
    throw new KeyError(key + " is not a valid APEv2 key");
  }
  // TODO - wtf is this?
  // key = key.encode('ascii')

  if (! (value instanceof _APEValue)) {
    // let's guess at the content if we're not already a value...
    if (typeof value === 'string') {
      // unicode? we've got to be text.
      // TODO: convert value to a buffer?
      value = new APEValue(value, TEXT);
    } else if (Array.isArray(value)) {
      // list? text.
      // TODO: convert items in value to buffers?
      value = new APEValue("\0".join(value), TEXT);
    } else if (Buffer.isBuffer(value)) {
      value = new APEValue(value, BINARY);
    } else {
      assert.ok(false, "Unknown value type");
    }
  }
  this.__casemap[key.toLowerCase()] = key;
  this.__dict[key.toLowerCase()] = value;
};

APEv2.prototype.keys = function() {
  var self = this;
  return Object.keys(self.__dict).map(function(key) {
    return self.__casemap[key] || key;
  });
};

APEv2.prototype.save = function(filename) {
  // Save changes to a file.
  // If no filename is given, the one most recently loaded is used.
  // Tags are always written at the end of the file, and include
  // a header and a footer.

  filename = filename || this.filename;
  var fileobj;
  try {
    fileobj = fs.openSync(filename, "r+");
  } catch (err) {
    fileobj = fs.openSync(filename, "w+");
  }

  var data = new _APEv2Data(fileobj);

  if (data.is_at_start) {
    delete_bytes(fileobj, data.end - data.start, data.start);
  } else if (data.start != null) {
    data.fileobj_seek = data.start;
    // Delete an ID3v1 tag if present, too.
    fs.ftruncateSync(fileobj, data.fileobj_seek);
  }
  var stats = fs.fstatSync(fileobj);
  data.fileobj_seek = stats.size;

  // "APE tags items should be sorted ascending by size... This is
  // not a MUST, but STRONGLY recommended. Actually the items should
  // be sorted by importance/byte, but this is not feasible."
  var tags = this.items().map(function(item) {
    var k = item[0]
      , v = item[1];
    return v._internal(k);
  });
  tags.sort(function(a, b) {
    // TODO - check if .length is the correct thing here
    return cmp(a.length, b.length);
  });
  var num_tags = tags.length;
  var totalTagBytes = 0;
  tags.forEach(function(tag) {
    totalTagBytes += tag.length;
  });

  var header = new Buffer(8 + 4 * 4 + 8);
  // version, tag size, item count, flags
  var offset = 0;
  header.write("APETAGEX", offset, 8, 'ascii');
  header.writeUInt32LE(2000, offset); offset += 4;
  header.writeUInt32LE(totalTagBytes + 32, offset); offset += 4;
  header.writeUInt32LE(num_tags, offset); offset += 4;
  header.writeUInt32LE(HAS_HEADER | IS_HEADER, offset); offset += 4;
  header.fill(0, offset);

  data.fileobj_seek += fs.writeSync(fileobj, header, 0, header.length, data.fileobj_seek);
  tags.forEach(function(tag) {
    data.fileobj_seek += fs.writeSync(fileobj, tag, 0, tag.length, data.fileobj_seek);
  });

  var footer = new Buffer(8 + 4 * 4 + 8);
  // version, tag size, item count, flags
  offset = 0;
  footer.write("APETAGEX", offset, 8, 'ascii');
  footer.writeUInt32LE(2000, offset); offset += 4;
  footer.writeUInt32LE(totalTagBytes + 32, offset); offset += 4;
  footer.writeUInt32LE(num_tags, offset); offset += 4;
  footer.writeUInt32LE(HAS_HEADER, offset); offset += 4;
  footer.fill(0, offset);

  data.fileobj_seek += fs.writeSync(fileobj, footer, 0, footer.length, data.fileobj_seek);
  fs.closeSync(fileobj);
};

APEv2.prototype.delete = function(filename) {
  // Remove tags from a file.

  filename = filename || this.filename;
  var fileobj = open(filename, "r+")
  try {
    var data = new _APEv2Data(fileobj);
    if (data.start != null && data.size != null) {
      delete_bytes(fileobj, data.end - data.start, data.start);
    }
  } finally {
    fileobj.close()
  }
  this.clear();
};

function _delete(filename) {
  // Remove tags from a file.
  try {
    (new APEv2(filename)).delete();
  } catch (err) {
    // TODO: make sure the error generated has code set to APENoHeaderError
    if (err.code !== 'APENoHeaderError') throw err;
  }
}

function APEValue(value, kind) {
  // APEv2 tag value factory.
  // Use this if you need to specify the value's type manually.  Binary
  // and text data are automatically detected by APEv2.__setitem__.

  if (kind === TEXT) {
    return new APETextValue(value, kind);
  } else if (kind === BINARY) {
    return new APEBinaryValue(value, kind);
  } else if (kind === EXTERNAL) {
    return new APEExtValue(value, kind);
  } else {
    assert.ok(false, "kind must be TEXT, BINARY, or EXTERNAL");
  }
}

function _APEValue(value, kind) {
  this.kind = kind;
  this.value = value;
}

_APEValue.prototype.length = function() {
  return this.value.length;
};

_APEValue.prototype.toString = function() {
  return this.value;
  // TODO - do anything with this?
  //def __repr__(self):
  //    return "%s(%r, %d)" % (type(self).__name__, self.value, self.kind)
};

_APEValue.prototype._internal = function(key) {
  // Packed format for an item:
  // 4B: Value length
  // 4B: Value type
  // Key name
  // 1B: Null
  // Key value
  var keyBuffer = new Buffer(key, 'utf8');
  var valueBuffer = new Buffer(this.value, 'utf8');
  var buffer = new Buffer(8 + keyBuffer.length + 1 + valueBuffer.length);
  var offset = 0;
  offset += buffer.writeUInt32LE(this.value.length, offset);
  offset += buffer.writeUInt32LE(this.kind << 1, offset);
  keyBuffer.copy(buffer, offset); offset += keyBuffer.length;
  offset += buffer.writeInt8(0, offset);
  valueBuffer.copy(buffer, offset); offset += valueBuffer.length;
  return buffer;
};

// An APEv2 text value.
// Text values are Unicode/UTF-8 strings. They can be accessed like
// strings (with a null seperating the values), or arrays of strings.
// TODO - is there a problem encoding/decoding utf8?
util.inherits(APETextValue, _APEValue);
function APETextValue() {
  _APEValue.apply(this, arguments);
}

// TODO - use this method instead of __getitem__, __len__, __cmp__ etc
APETextValue.prototype.toArray = function() {
  return this.value.split("\0");
};

APETextValue.prototype.fromArray = function(array) {
  this.value = "\0".join(array);
};

APETextValue.prototype.pprint = function() {
  return this.toArray().join(" / ");
};


// An APEv2 binary value.
util.inherits(APEBinaryValue, _APEValue);
function APEBinaryValue() {
  _APEValue.apply(this, arguments);
}

APEBinaryValue.prototype.pprint = function() {
  return "[" + this.length() + " bytes]";
};


// An APEv2 external value.
// External values are usually URI or IRI strings.
util.inherits(APEExtValue, _APEValue);
function APEExtValue() {
  _APEValue.apply(this, arguments);
}

APEExtValue.prototype.pprint = function() {
  return "[External] " + this.value;
};

util.inherits(APEv2File, FileType);
function APEv2File() {
  FileType.apply(this, arguments);
}

APEv2File.score = function(filename, fileobj, header) {
  // TODO - async
  var stats = fs.fstatSync(fileobj);
  var seekPos = stats.size - 160;
  if (seekPos < 0) seekPos = 0;
  var footer = new Buffer(160);
  seekPos += fs.readSync(fileobj, footer, 0, 160, seekPos);
  return (footer.toString('ascii').indexOf("APETAGEX") >= 0) -
    (header.toString('ascii', 0, 3) === 'ID3');
};

APEv2File.prototype._Info = function(fileobj) {
  this.length = 0;
  this.bitrate = 0;
};

APEv2File.prototype._Info.prototype.pprint = function() {
  return "Unknown format with APEv2 tag.";
};

APEv2File.prototype.load = function(filename) {
  this.filename = filename;
  this.info = new this._Info(fs.openSync(filename, "r"));
  try {
    this.tags = new APEv2(filename);
  } catch (err) {
    this.tags = null;
  }
};

APEv2File.prototype.add_tags = function() {
  assert.equal(this.tags, null, this + " already has tags: " + this.tags);
  this.tags = new APEv2();
};

function minString(str) {
  var c = str[0];
  for (var i = 1; i < str.length; ++i) {
    if (str[i] < c) c = str[i];
  }
  return c;
}

function maxString(str) {
  var c = str[0];
  for (var i = 1; i < str.length; ++i) {
    if (str[i] > c) c = str[i];
  }
  return c;
}

function maxNumber(a, b) {
  return a > b ? a : b;
}

function is_valid_apev2_key(key) {
  return (2 <= key.length && key.length <= 255 &&
      minString(key) >= ' ' && maxString(key) <= '~' && !INVALID_KEYS[key])
}

function cmp(a, b) {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
}
