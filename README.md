mutagen for node.js

This is a direct port of mutagen to node.js. I plan to do the port in 3 steps.

1. Get a straight up port working and passing all the tests. This will be
   synchronous, slow, ugly, dirty, and have basically the same API as mutagen.
2. Convert to async, and get the tests passing again. This will be slow, ugly,
   and dirty, and have a weird API that makes no sense.
3. Refactor the hell out of the code and switch to an API that makes sense for
   node. Once the tests are again passing, this will be fast, pretty, clean,
   and have a new API.
4. Switch license from GPL to BSD. I think we can do this once none of the code
   at all resembles the old code.
