# mutagen for node.js

This is a direct port of mutagen to node.js. I plan to do the port in 3 steps.

## The Plan

1. Get a straight up port working and passing all the tests. This will be
   synchronous, slow, ugly, dirty, and have basically the same API as mutagen.
2. Convert to async, and get the tests passing again. This will be slow, ugly,
   and dirty, and have a weird API that makes no sense.
3. Refactor the hell out of the code and switch to an API that makes sense for
   node. Once the tests are again passing, this will be fast, pretty, clean,
   and have a new API.
4. Switch license from GPL to BSD? Maybe we can do this once none of the code
   at all resembles the old code.

## Current Status

Working towards step 1:

 * [~] - APEv2          (4 tests pending)
 * [ ] - ASF            (1011 lines left)
 * [ ] - easy ID3       (742 lines left)
 * [ ] - easy MP4       (401 lines left)
 * [ ] - FLAC           (1320 lines left)
 * [ ] - ID3            (3946 lines left)
 * [ ] - M4A            (788 lines left)
 * [ ] - Monkey's Audio (133 lines left)
 * [ ] - MP3            (431 lines left)
 * [ ] - MP4            (1432 lines left)
 * [ ] - musepack       (360 lines left)
 * [ ] - Ogg FLAC       (235 lines left)
 * [ ] - Ogg Opus       (168 lines left)
 * [ ] - Ogg            (1028 lines left)
 * [ ] - Ogg Speex      (192 lines left)
 * [ ] - Ogg Theora     (188 lines left)
 * [ ] - Ogg Vorbis     (300 lines left)
 * [ ] - Optim Frog     (104 lines left)
 * [ ] - True Audio     (117 lines left)
 * [x] - WavPack

Progress by lines of code: 2692 / 15588 = 17%

### Key

 * `[ ]` = not yet started
 * `[~]` = code is ported. not all tests pass.
 * `[x]` = done, tested, and working
