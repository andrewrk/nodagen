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
  it.skip("delete_one", function() {
    var o = file('a');
    deleteBytesSync(o, 1, 0);
    assert.strictEqual('', read(o));
  });
  it.skip("delete_first_of_two", function() {
    //def test_delete_first_of_two(self):
    //    o = self.file('ab')
    //    delete_bytes(o, 1, 0)
    //    self.assertEquals('b', self.read(o))
  });
  it.skip("delete_second_of_two", function() {
    //def test_delete_second_of_two(self):
    //    o = self.file('ab')
    //    delete_bytes(o, 1, 1)
    //    self.assertEquals('a', self.read(o))
  });
  it.skip("delete_third_of_two", function() {
    //def test_delete_third_of_two(self):
    //    o = self.file('ab')
    //    self.assertRaises(AssertionError, delete_bytes, o, 1, 2)
  });
  it.skip("delete_middle", function() {
    //def test_delete_middle(self):
    //    o = self.file('abcdefg')
    //    delete_bytes(o, 3, 2)
    //    self.assertEquals('abfg', self.read(o))
  });
  it.skip("delete_across_end", function() {
    //def test_delete_across_end(self):
    //    o = self.file('abcdefg')
    //    self.assertRaises(AssertionError, delete_bytes, o, 4, 8)
  });
  it.skip("delete_zero", function() {
    //def test_delete_zero(self):
    //    o = self.file('abcdefg')
    //    self.assertRaises(AssertionError, delete_bytes, o, 0, 3)
  });
  it.skip("delete_negative", function() {
    //def test_delete_negative(self):
    //    o = self.file('abcdefg')
    //    self.assertRaises(AssertionError, delete_bytes, o, 4, -8)
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
  it.skip("test_delete_6106_79_51760", function() {
    //def test_delete_6106_79_51760(self):
    //    # This appears to be due to ANSI C limitations in read/write on rb+
    //    # files. The problematic behavior only showed up in our mmap fallback
    //    # code for transfers of this or similar sizes. 
    //    data = ''.join(map(str, range(12574))) # 51760 bytes
    //    o = self.file(data[:6106+79] + data[79:])
    //    delete_bytes(o, 6106, 79)
    //    self.failUnless(data == self.read(o))
  });
  it.skip("many_changes", function() {
    //# Generate a bunch of random insertions, apply them, delete them,
    //# and make sure everything is still correct.
    //# 
    //# The num_runs and num_changes values are tuned to take about 10s
    //# on my laptop, or about 30 seconds since we we have 3 variations
    //# on insert/delete_bytes brokenness. If I ever get a faster
    //# laptop, it's probably a good idea to increase them.
    //def test_many_changes(self, num_runs=5, num_changes=300,
    //                      min_change_size=500, max_change_size=1000,
    //                      min_buffer_size=1, max_buffer_size=2000):
    //    self.failUnless(min_buffer_size < min_change_size and
    //                    max_buffer_size > max_change_size and
    //                    min_change_size < max_change_size and
    //                    min_buffer_size < max_buffer_size,
    //                    "Given testing parameters make this test useless")
    //    for j in range(num_runs):
    //        data = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 1024
    //        fobj = self.file(data)
    //        filesize = len(data)
    //        # Generate the list of changes to apply
    //        changes = []
    //        for i in range(num_changes):
    //            change_size = random.randrange(min_change_size, max_change_size)
    //            change_offset = random.randrange(0, filesize)
    //            filesize += change_size
    //            changes.append((change_offset, change_size))

    //        # Apply the changes, and make sure they all took.
    //        for offset, size in changes:
    //            buffer_size = random.randrange(min_buffer_size, max_buffer_size)
    //            insert_bytes(fobj, size, offset, BUFFER_SIZE=buffer_size)
    //        fobj.seek(0)
    //        self.failIfEqual(fobj.read(len(data)), data)
    //        fobj.seek(0, 2)
    //        self.failUnlessEqual(fobj.tell(), filesize)

    //        # Then, undo them.
    //        changes.reverse()
    //        for offset, size in changes:
    //            buffer_size = random.randrange(min_buffer_size, max_buffer_size)
    //            delete_bytes(fobj, size, offset, BUFFER_SIZE=buffer_size)
    //        fobj.seek(0)
    //        self.failUnless(fobj.read() == data)
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
