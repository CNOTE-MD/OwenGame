# Classical pieces in the game

Five pieces by **Edvard Grieg** (1843-1907), Norway's best-known composer. Grieg died in 1907, so the compositions are in the public domain.

The MIDI files in `music/midi/grieg_*.mid` come from the [Mutopia Project](https://www.mutopiaproject.org/), a volunteer library of free sheet music. Each of these five is marked **Public Domain** on its Mutopia page (checked November 2026). They are unmodified.

| File | Piece | Mutopia page | Typeset by | In the game |
|---|---|---|---|---|
| `grieg_mountain_king.mid` | In the Hall of the Mountain King, Peer Gynt Suite No. 1, Op. 46 No. 4 | [piece 1888](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) | Coyau | The Hidden Cave |
| `grieg_troldtog.mid` | March of the Trolls (Troldtog), Lyric Pieces Op. 54 No. 3 | [piece 2014](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2014) | Anonymous | Mini-bosses: the Penguin Knight and the Draugr Captain |
| `grieg_troldhaugen.mid` | Wedding Day at Troldhaugen, Lyric Pieces Op. 65 No. 6 | [piece 781](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=781) | David Whipple | Baron Blubber's Sauna (first section) |
| `grieg_mountaineer.mid` | The Mountaineer's Song (Lualåt), Lyric Pieces Op. 73 No. 7 | [piece 1628](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1628) | Ted Stanion | The bell crypt |
| `grieg_aases_death.mid` | Aase's Death, Peer Gynt Suite No. 1, Op. 46 No. 2 | [piece 246](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=246) | Deborah Lowrey | GAME OVER (first statement) |

The scores are for piano. `tools/arrange_classics.js` arranges them for the game's band (melody to the lead, low left hand to the bass, the rest to chords, drums on the score's own beats, instruments chosen block by block) and writes `music/classics.json`, which the build inlines.

## What is not here, and why

Freely *downloadable* is not the same as free to *use*. MIDI files of songs by Rush, Journey, Queen and the rest are all over the web, but those songs are under copyright and a public game cannot ship them. The game's rock tracks stay original pieces written in the sound of those bands. A player who has such files can still play them in their own copy: OWEN'S SCRIPT, My music (see `web/src/mymusic.js`); those files never leave the device.
