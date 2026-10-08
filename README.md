# Jöntuka: A Viking Tale

**Main build: the browser version in `web/`** (play it via the published artifact link). The Godot project in the repo root is frozen as the original prototype; the browser build is the low-res reference for a later Unity rebuild.

## Browser build

| Path | What it is |
|---|---|
| `web/src/story.js` | Every word in the game, including everything Jon says on his own (`JON`). Owen can edit this. |
| `web/src/jon.js` | Jon's personality (faces, when he talks) and growth (XP, levels, perks, abilities) |
| `tools/maps.py` | ASCII maps for Norway, the Penguin Palace, the subway, the Barrow and Owen's room, plus a reachability checker |
| `web/src/magic.js` | Magic and items: Rune Spells (Thunder, Frost, Fire, Mend on the rune meter), the Bag (salmon, lutefisk, shards), Charms (one worn at a time), the SPELLS and BAG menu pages |
| `web/src/awesome.js` | Boss title cards, hit-stop, combo callouts, the Jukebox, Snow Penguins and Royal Guards, King Owen, title-screen flair |
| `web/src/snes.js` | The SNES pass: day/night, weather, tall grass and muck, Spore Cap/Slime/Beetle, rune tablets, the map page, and Owen's page 5 (subway, taxi, the big log) |
| `web/src/*.js` | Engine, world, actors, sprites, UI, main loop |
| `web/src/arena.js` | Valhalla Arena: waves, shop cards, level-ups (tune or add cards here) |
| `tools/score.py` | The music: original pieces as step sequences. Rush-style odd meters for the title, overworld, dungeon, boss, arena, Bjarne and Barrow; four pieces in the sound of Owen's bands: Cold as Fjord (Foreigner) on the frozen screens, Don't Stop Choppin' (Journey) in the Muck Forest and the taxi, Walk This Fjord (Aerosmith) in the subway, Penguin Rhapsody (Queen) in the Penguin Palace. Run it, then `tools/music_to_midi.py` to refresh `music/midi/*.mid` |
| `OWEN_QUESTIONS.md` | Prompts to ask Owen after he plays; his answers drive the next build |
| `STORY_BIBLE.md` | Characters, chapter arc, items, the Red-Eye side quest, Arena mode |

Rebuild: `python3 tools/maps.py && python3 tools/build_web.py`. Test: `NODE_PATH=$(npm root -g) node tests/web_playtest.js`, then `tests/arena_playtest.js`, `tests/ch1_depth_test.js`, `tests/redeye_test.js`, `tests/ch2_test.js`, `tests/jon_test.js`, `tests/pad_test.js`, `tests/snes_test.js` and `tests/magic_test.js` the same way.

## Godot prototype (frozen)

A top-down action game in the style of SNES *A Link to the Past*, based on Owen's journal story. Godot 4.3.

## Play

**Mac:** download `builds/JontukaViking-mac.zip` and unzip it, then right-click the app and choose Open (the first launch is blocked until you do, because the app isn't signed).
**Windows:** unzip `builds/JontukaViking-windows.zip`, then double-click `JontukaViking.exe`; if SmartScreen warns, choose More info, then Run anyway.
**From source:** open this folder in Godot 4.3 and press F5.
**Rebuild:** `godot --headless --path . --export-release macOS export/mac/JontukaViking.zip` (also `Windows`, `Web`); needs Godot 4.3 export templates.

| Key | Action |
|---|---|
| Arrows / WASD, left stick, or the on-screen thumbstick | Move |
| ⛶ FULL SCREEN button | Fills the screen (iPad: tap it, then rotate to landscape). Controllers over Bluetooth: A swing, B throw, X thunder, Y horn, RB/RT dash, Start gear |
| Z / Space / J | Swing Jon (sword); also advances dialogue |
| X / K / Shift | Throw Jon (boomerang) |

Stepping into the lake makes Jon rocket you out onto the shore. The first time you die you come back as a voodoo zombie (hits harder); the second time is game over. Beat the possessed penguin boss to finish chapter 1.

## For Owen: change the game without coding

| File | What it controls |
|---|---|
| `data/dialogue.json` | Everything characters say, Jon's random quips, end text |
| `data/tuning.json` | Hearts, speeds, damage, penguin and boss health |
| `data/level_lake.txt` | The map. `T` tree, `#` rock, `~` lake, `s` sand, `.` grass, `@` start, `p` penguin, `B` boss, `L` lake landing spot |

Story source: `story/OWEN_STORY_TRANSCRIPT.md`. Design notes: `DESIGN.md`.

## Test

```
godot --headless --path . --script tests/smoke_test.gd
```
