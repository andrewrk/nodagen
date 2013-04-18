module.exports = {
  deleteBytesSync: deleteBytesSync,
  insertBytesSync: insertBytesSync,
};

var assert = require('assert');
var fs = require('fs');

function lock(fileobj) {
  // Lock a file object 'safely'.

  // That means a failure to lock because the platform doesn't
  // support fcntl or filesystem locks is not considered a
  // failure. This call does block.

  // Returns whether or not the lock was successful, or
  // raises an exception in more extreme circumstances (full
  // lock table, invalid file).

  // TODO - actually lock the file
  // maybe fs-ext module could do the trick

  return false;
}

function unlock(fileobj) {
  // Unlock a file object.

  // Don't call this on a file object unless a call to lock()
  // returned true.

  // If this fails there's a mismatched lock/unlock pair,
  // so we definitely don't want to ignore errors.

  // TODO - actually implement locking
}

function insertBytesSync(fobj, size, offset, bufferSize) {
  // Insert size bytes of empty space starting at offset.

  // fobj must be an open file object, open rb+ or
  // equivalent. Mutagen tries to use mmap to resize the file, but
  // falls back to a significantly slower method if mmap fails.
  
  assert.ok(0 < size);
  assert.ok(0 <= offset);
  var locked = false;
  var stats = fs.fstatSync(fobj);
  var filesize = stats.size;
  var buffer = new Buffer(min(bufferSize || 65536, filesize));
  buffer.fill(0);
  var movesize = filesize - offset;
  var padsize = size;
  var seek = stats.size;
  var addsize;

  try {
    locked = lock(fobj);

    // Don't generate an enormous string if we need to pad
    // the file out several megs.
    while (padsize) {
      addsize = min(padsize, buffer.length);
      seek += fs.writeSync(fobj, buffer, 0, addsize, seek);
      padsize -= addsize;
    }

    seek = filesize;
    while (movesize) {
      // At the start of this loop, fobj is pointing at the end
      // of the data we need to move, which is of movesize length.
      var thismove = min(buffer.length, movesize)
      // Seek back however much we're going to read this frame.
      seek -= thismove;
      var nextpos = seek;
      // Read it, so we're back at the end.
      seek += fs.readSync(fobj, buffer, 0, thismove, seek);
      // Seek back to where we need to write it.
      seek += -thismove + size;
      // Write it.
      fs.writeSync(fobj, buffer, 0, thismove, seek);
      // And seek back to the end of the unmoved data.
      seek = nextpos;
      movesize -= thismove;
    }

    fs.fsyncSync(fobj);
  } finally {
    if (locked) unlock(fobj);
  }
}

function deleteBytesSync(fobj, size, offset, bufferSize) {
  // Delete size bytes of empty space starting at offset.

  // fobj must be an open file object, open rb+ or
  // equivalent. Mutagen tries to use mmap to resize the file, but
  // falls back to a significantly slower method if mmap fails.

  var locked = false;
  assert.ok(0 < size);
  assert.ok(0 <= offset);
  var stats = fs.fstatSync(fobj);
  var seek = stats.size;
  var filesize = stats.size;
  var buffer = new Buffer(min(bufferSize || 65536, filesize));
  var movesize = filesize - offset - size;
  assert.ok(0 <= movesize);
  try {
    if (movesize > 0) {
      fs.fsyncSync(fobj);
      locked = lock(fobj);
      seek = offset + size;
      var readCount = fs.readSync(fobj, buffer, 0, buffer.length, seek);
      while (readCount) {
        seek = offset;
        seek += fs.writeSync(fobj, buffer, 0, readCount, seek);
        offset += readCount;
        seek = offset + size;
        readCount = fs.readSync(fobj, buffer, 0, buffer.length, seek);
      }
    }
    fs.ftruncateSync(fobj, filesize - size);
    fs.fsyncSync(fobj);
  } finally {
    if (locked) unlock(fobj);
  }
}

function min(a, b) {
  return a < b ? a : b;
}
