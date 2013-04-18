var temp = require("temp")
  , fs = require("fs")
  , assert = require("assert")
  , _util = require("../lib/_util")
  , insertBytesSync = _util.insertBytesSync
  , deleteBytesSync = _util.deleteBytesSync;

describe("FileHandling", function() {
  it("insert_into_empty", function() {
    var o = file('');
    insertBytesSync(o, 8, 0);
    assert.strictEqual(ss("\x00", 8), read(o));
  });
  it("insert_before_one", function() {
    var o = file("a");
    insertBytesSync(o, 8, 0);
    assert.strictEqual('a' + ss("\x00", 7) + 'a', read(o));
  });
  it("insert_after_one", function() {
    var o = file('a');
    insertBytesSync(o, 8, 1);
    assert.strictEqual('a' + ss('\x00', 8), read(o));
  });
  it("smaller_than_file_middle", function() {
    var o = file('abcdefghij');
    insertBytesSync(o, 4, 4);
    assert.strictEqual('abcdefghefghij', read(o));
  });
  it("smaller_than_file_to_end", function() {
    var o = file('abcdefghij');
    insertBytesSync(o, 4, 6);
    assert.strictEqual('abcdefghijghij', read(o));
  });
  it("smaller_than_file_across_end", function() {
    var o = file('abcdefghij');
    insertBytesSync(o, 4, 8);
    assert.strictEqual('abcdefghij\x00\x00ij', read(o));
  });
  it("smaller_than_file_at_end", function() {
    var o = file('abcdefghij');
    insertBytesSync(o, 3, 10);
    assert.strictEqual('abcdefghij\x00\x00\x00', read(o));
  });
  it("smaller_than_file_at_beginning", function() {
    var o = file('abcdefghij');
    insertBytesSync(o, 3, 0);
    assert.strictEqual('abcabcdefghij', read(o));
  });
  it("zero", function() {
    var o = file('abcdefghij');
    assert.throws(function() {
      insertBytesSync(o, 0, 1);
    }, /AssertionError/);
  });
  it("negative", function() {
    var o = file('abcdefghij');
    assert.throws(function() {
      insertBytesSync(o, 8, -1);
    }, /AssertionError/);
  });
  it("delete_one", function() {
    var o = file('a');
    deleteBytesSync(o, 1, 0);
    assert.strictEqual('', read(o));
  });
  it("delete_first_of_two", function() {
    var o = file('ab');
    deleteBytesSync(o, 1, 0);
    assert.strictEqual('b', read(o));
  });
  it("delete_second_of_two", function() {
    var o = file('ab');
    deleteBytesSync(o, 1, 1);
    assert.strictEqual('a', read(o));
  });
  it("delete_third_of_two", function() {
    var o = file('ab');
    assert.throws(function() {
      deleteBytesSync(o, 1, 2);
    }, /AssertionError/);
  });
  it("delete_middle", function() {
    var o = file('abcdefg');
    deleteBytesSync(o, 3, 2);
    assert.strictEqual('abfg', read(o));
  });
  it("delete_across_end", function() {
    var o = file('abcdefg');
    assert.throws(function() {
      deleteBytesSync(o, 4, 8);
    }, /AssertionError/);
  });
  it("delete_zero", function() {
    var o = file('abcdefg');
    assert.throws(function() {
      deleteBytesSync(o, 0, 3);
    }, /AssertionError/);
  });
  it("delete_negative", function() {
    var o = file('abcdefg');
    assert.throws(function() {
      deleteBytesSync(o, 4, -8);
    }, /AssertionError/);
  });
  it("test_insert_6106_79_51760", function() {
    // This appears to be due to ANSI C limitations in read/write on rb+
    // files. The problematic behavior only showed up in our mmap fallback
    // code for transfers of this or similar sizes.
    var data = specialDataFromRange();
    var o = file(data);
    insertBytesSync(o, 6106, 79);
    assert.strictEqual(data.substring(0, 6106+79) + data.substring(79), read(o));
  });
  it("test_delete_6106_79_51760", function() {
    // This appears to be due to ANSI C limitations in read/write on rb+
    // files. The problematic behavior only showed up in our mmap fallback
    // code for transfers of this or similar sizes. 
    var data = specialDataFromRange();
    var o = file(data.substring(0, 6106+79) + data.substring(79));
    deleteBytesSync(o, 6106, 79);
    assert.strictEqual(data, read(o));
  });
  it("many_changes", function() {
    // Generate a bunch of random insertions, apply them, delete them,
    // and make sure everything is still correct.
    // 
    // The num_runs and num_changes values are tuned to take about 10s
    // on my laptop, or about 30 seconds since we we have 3 variations
    // on insert/delete_bytes brokenness. If I ever get a faster
    // laptop, it's probably a good idea to increase them.
    var num_runs = 5
      , num_changes = 300
      , min_change_size = 500
      , max_change_size = 1000
      , min_buffer_size = 1
      , max_buffer_size = 2000;

    assert.ok(min_buffer_size < min_change_size);
    assert.ok(max_buffer_size > max_change_size);
    assert.ok(min_change_size < max_change_size);
    assert.ok(min_buffer_size < max_buffer_size);

    for (var j = 0; j < num_runs; ++j) {
      var data = ss("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1024);
      var fobj = file(data);
      var filesize = data.length;
      // Generate the list of changes to apply
      var changes = [];
      var i;
      for (i = 0; i < num_changes; ++i) {
        var change_size = randrange(min_change_size, max_change_size);
        var change_offset = randrange(0, filesize);
        filesize += change_size;
        changes.push([change_offset, change_size]);
      }

      // Apply the changes, and make sure they all took.
      var buffer_size, offset, size;
      for (i = 0; i < changes.length; ++i) {
        offset = changes[i][0];
        size = changes[i][1];
        buffer_size = randrange(min_buffer_size, max_buffer_size);
        insertBytesSync(fobj, size, offset, buffer_size);
      }
      assert.notEqual(read(fobj), data);
      var stats = fs.fstatSync(fobj);
      assert.strictEqual(stats.size, filesize);

      // Then, undo them.
      changes.reverse();
      for (i = 0; i < changes.length; ++i) {
        offset = changes[i][0];
        size = changes[i][1];
        buffer_size = randrange(min_buffer_size, max_buffer_size);
        deleteBytesSync(fobj, size, offset, buffer_size);
      }
      assert.strictEqual(read(fobj), data);
    }
  });
});

function file(contents) {
  var tempfile = temp.openSync();
  var buffer = new Buffer(contents);
  fs.writeSync(tempfile.fd, buffer, 0, buffer.length, 0);
  fs.fsyncSync(tempfile.fd);
  return tempfile.fd;
}
function read(fobj) {
  var stats = fs.fstatSync(fobj);
  if (stats.size === 0) return "";
  var buffer = new Buffer(stats.size);
  fs.readSync(fobj, buffer, 0, buffer.length, 0);
  return buffer.toString('utf8');
}
function ss(s, n) {
  var result = "";
  for (var i = 0; i < n; ++i) {
    result += s;
  }
  return result;
}
function specialDataFromRange() {
  // ported from python code:
  // ''.join(map(str, range(12574))) # 51760 bytes
  var result = "";
  for (var i = 0; i < 12574; ++i) {
    result += i;
  }
  assert.strictEqual(result.length, 51760);
  return result;
}
function randrange(lower, upper) {
  return lower + Math.floor(Math.random() * (upper - lower));
}
