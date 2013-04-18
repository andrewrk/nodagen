module.exports = Metadata;

// An abstract dict-like object.
// Metadata is the base class for many of the tag objects in Mutagen.
function Metadata() {
  if (arguments.length) this.load.apply(this, arguments);
}

Metadata.prototype.load = function() {
  throw new Error("Not implemented");
};
Metadata.prototype.save = function(filename) {
  throw new Error("Not implemented");
};
Metadata.prototype.delete = function(filename) {
  throw new Error("Not implemented");
};
