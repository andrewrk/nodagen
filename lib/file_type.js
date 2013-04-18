module.exports = FileType;

var assert = require('assert');
var util = require('util');
var KeyError = require('./key_error');

// An abstract object wrapping tags and audio stream information.
//
// Attributes:
//
// * info -- stream information (length, bitrate, sample rate)
// * tags -- metadata tags, if any
//
// Each file format has different potential tags and stream
// information.
//
// FileTypes implement an interface very similar to Metadata; the
// dict interface, save, load, and delete calls on a FileType call
// the appropriate methods on its tag data.
function FileType() {
  assert.ok(arguments.length > 0);
  this.info = null;
  // TODO - switch to using getItem/setItem etc on tags?
  this.tags = null;
  this.filename = null;
  // TODO: figure out this mimes thing
  this._mimes = ["application/octet-stream"];
  this.load.apply(this, arguments);
}

FileType.prototype.load = function(filename) {
  throw new Error("Not implemented.");
};

// TODO - find all instances of using a FileType as a dict
// and make it use these methods instead
// __getitem__
FileType.prototype.getItem = function(key) {
  // Look up a metadata tag key.
  // If the file has no tags at all, a KeyError is raised.
  if (this.tags == null) {
    throw new KeyError(key);
  } else {
    return this.tags[key];
  }
};

// __setitem__
FileType.prototype.setItem = function(key, value) {
  // Set a metadata tag.
  // If the file has no tags, an appropriate format is added (but
  // not written until save is called).
  if (this.tags == null) this.add_tags();
  this.tags[key] = value;
};

// __delitem__
FileType.prototype.delItem = function(key) {
  // Delete a metadata tag key.
  // If the file has no tags at all, a KeyError is raised.
  if (this.tags == null) {
    throw new KeyError(key);
  } else {
    delete this.tags[key];
  }
};

FileType.prototype.keys = function() {
  // Return a list of keys in the metadata tag.
  // If the file has no tags at all, an empty list is returned.
  // TODO - Object.keys() may not be right
  return this.tags == null ? [] : Object.keys(this.tags);
};

FileType.prototype.delete = function() {
  // Remove tags from a file.
  if (this.tags != null) {
    var x = this.tags[this.filename];
    delete this.tags[this.filename];
    return x;
  } else {
    return null;
  }
};

FileType.prototype.save = function() {
  // Save metadata tags.
  if (this.tags != null) {
    return this.tags.save(this.tags, [this.filename].concat(arguments));
  } else {
    var err = new Error("ValueError: no tags in file");
    err.code = "ValueError";
    throw err;
  }
};

FileType.prototype.pprint = function() {
  // Print stream information and comment key=value pairs.
  var stream = this.info.pprint() + " (" + this.mime()[0] + ")";
  var tags;
  try {
    tags = this.tags.pprint();
  } catch (err) {
    return stream;
  }
  return stream + ((tags && "\n" + tags) || "");
};

FileType.prototype.add_tags = function() {
  throw new Error("Not implemented.");
};

FileType.prototype.mime = function() {
  return this._mimes;
};
