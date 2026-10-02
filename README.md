# Jöntuka: A Viking Tale

A top-down action game in the style of SNES *A Link to the Past*, based on Owen's journal story. Godot 4.3.

## Play

Open this folder in Godot 4.3 and press F5.

| Key | Action |
|---|---|
| Arrows / WASD | Move |
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
