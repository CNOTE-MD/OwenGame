# Music in the game that the game did not write

Everything here is free to use. Nothing here is a copyrighted song. There are two kinds.

## 1. Public-domain classics

The composers died long ago, so the music is in the public domain. The MIDI files come from the [Mutopia Project](https://www.mutopiaproject.org/), a volunteer library of free sheet music; each of these is marked **Public Domain** on its Mutopia page (checked November 2026). The files in `music/midi/` are unmodified.

| File | Piece | Mutopia page | Typeset by | In the game |
|---|---|---|---|---|
| `grieg_mountain_king.mid` | Grieg, In the Hall of the Mountain King, Peer Gynt Suite No. 1, Op. 46 No. 4 | [piece 1888](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) | Coyau | The Hidden Cave |
| `grieg_troldtog.mid` | Grieg, March of the Trolls (Troldtog), Lyric Pieces Op. 54 No. 3 | [piece 2014](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2014) | Anonymous | Mini-bosses: the Penguin Knight and the Draugr Captain |
| `grieg_troldhaugen.mid` | Grieg, Wedding Day at Troldhaugen, Lyric Pieces Op. 65 No. 6 | [piece 781](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=781) | David Whipple | Baron Blubber's Sauna (first section) |
| `grieg_mountaineer.mid` | Grieg, The Mountaineer's Song (Lualåt), Lyric Pieces Op. 73 No. 7 | [piece 1628](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1628) | Ted Stanion | The bell crypt |
| `grieg_aases_death.mid` | Grieg, Aase's Death, Peer Gynt Suite No. 1, Op. 46 No. 2 | [piece 246](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=246) | Deborah Lowrey | GAME OVER (first statement) |
| `bach_toccata_fugue.mid` | J. S. Bach, Toccata and Fugue in D minor, BWV 565 | [piece 1780](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1780) | see the Mutopia page | The palace lobby, once "dead Chilly" is lying in it (the Toccata) |
| `beethoven_fifth.mid` | Beethoven, Symphony No. 5, Op. 67, first movement, piano reduction | [piece 497](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=497) | see the Mutopia page | Valhalla Arena, waves 9 to 12 (the exposition) |

Edvard Grieg (1843-1907) is Norway's best-known composer, which is why he has the most pieces in a game set in Norway.

## 2. Original rock and metal, dedicated to the public domain

These are original compositions that their composers released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) on [OpenGameArt.org](https://opengameart.org/): no rights reserved, no credit required. They are credited here and in the game anyway. The files in `music/midi/` are unmodified.

| File | Track | Composer | OpenGameArt page | In the game |
|---|---|---|---|---|
| `cc0_nene_endless_pain.mid` | Endless Pain of Nightmares | nene | [endless-pain-of-nightmares](https://opengameart.org/content/endless-pain-of-nightmares) | Valhalla Arena, waves 5 to 8 |
| `cc0_r0rque_fight_harder.mid` | Fight Harder... To Obtain a Better Victory! | R0rque | [double-impact-midi-pack](https://opengameart.org/content/double-impact-midi-pack) | Valhalla Arena, waves 13 to 16 |
| `cc0_continuum_liberate_the_stars.mid` | Liberate the Stars | continuum.mid | [double-impact-midi-pack](https://opengameart.org/content/double-impact-midi-pack) | Valhalla Arena, waves 17 to 20 |
| `cc0_zemystic_andromeda.mid` | Andromeda | ZeMystic | [double-impact-midi-pack](https://opengameart.org/content/double-impact-midi-pack) | The Arena's shop |

The Double Impact pack was organized by northivanastan, whose page says: "I asked all contributors to create fully original music, and dedicate their work to the public domain so it could be used in other projects."

## How they become game music

`tools/arrange_classics.js` writes `music/classics.json`, which the build inlines.

- **Keyboard scores** (the classics) are arranged for the band: melody to the lead, the low notes to the bass, the rest to chords, drums written on the score's own beats, and instruments chosen block by block so the band follows the shape of the piece.
- **Band tracks** (the CC0 originals) already have guitars, bass and drums, so they go through the same General MIDI mapping the game uses for a player's own files.

Either way the game's synth plays them, so they sound like the rest of the game, not like the original recordings or soundfonts.

## What is not here, and why

Freely *downloadable* is not the same as free to *use*. MIDI files of songs by Rush, Queen, Journey, Metallica and the rest are all over the web, but those songs are under copyright and the sites offering them have no right to. None of them are here. The game's rock tracks stay original pieces written in the sound of those bands, and the tracks above were chosen because their instrumentation and tempo suit the same feel. A player who has their own files can still play them in their own copy: OWEN'S SCRIPT, My music (see `web/src/mymusic.js`); those files never leave the device.
