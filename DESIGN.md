# Jon and the Viking Tale: game design (draft for sign-off)

Engine: Godot 4 (GDScript). Source story: `story/OWEN_STORY_TRANSCRIPT.md`.

## Pitch

You play Owen's narrator, an undead voodoo zombie bonded to Jon (Jöntuka), a flying, talking, singing Viking axe who can recite Rush E from memory. Jon is loyal, impatient and sticks to you. Fight through Norway's lake and a haunted flight, with Jon as your weapon and your sidekick.

## Core mechanic (proposal)

Top-down 2D action-adventure in the style of SNES *A Link to the Past* (16px tiles, 256x224, 8-direction movement, hearts, dialogue boxes). Decided with Chase: story is ongoing (chapters will be added), no drawings from Owen (pixel art is drawn in code), the demon is a real fight. Jon is thrown, hovers, and returns like a boomerang; he talks in speech bubbles (Owen's voice: bossy, proud, loyal). Because you are bonded to Jon, dying brings you back as a zombie once per room ("un-unalived"), and zombie mode unlocks a voodoo power.

| Story beat | Game level | Mechanic |
|---|---|---|
| Waking up, wooden "WORLD'S BEST OWNER" sign | 1. Home (tutorial) | Move, throw and recall Jon; Jon nags; place the sign in the room |
| Lake, "lady of the lake" rocket, possessed penguin | 2. Norway lake + penguin boss | Dodge the chasing penguin; dive in lake and Jon rockets you out; boss fight |
| Death, voodoo bond, zombie | Built into 2 | Die once, revive as zombie with voodoo power; Jon's penguin-noise nightmares as a later hazard |
| Plane, demon flight attendant | 3. Flight 364 | Cabin corridor; refreshments cart; she turns to talons and fangs; Jon is in the cargo hold, so you must reach him |
| Story ends at "I tried to call Jon." | Open | Needs Owen's ending |

## Vertical slice (first build)

Level 2 only: player, Jon throw/recall, penguin enemy and boss, lake dive, zombie revive, Owen's text for the intro. Placeholder art. Exported to web and desktop.

## Co-design with Owen

Names, dialogue, enemy stats and level layouts live in plain data files under `data/`, with a short README so Owen can change them and see the result.

## Open items for you and Owen

1. What happens next after the demon flight attendant? Does Jon arrive in time?
2. Real name of Walter the Wonderful (Owen couldn't remember it in the story; keep the joke?).
3. Does Owen want his own drawings used as art? Otherwise placeholder pixel art.
4. Unreadable words on pages 1 and 2 (marked `[?]` in the transcript).
5. Tone: the story is funny/spooky; the penguin is the villain, and the demon is played as a scare. Confirm that is the intent.

## Presentation (October 2026 art pass)

- **Type:** one hand-built bitmap font (`web/src/pixelfont.js`), 7-pixel caps, 5-pixel lowercase, 2-pixel descenders, with the accents and symbols the story uses. No system fonts anywhere. Text takes a drop shadow, an outline (HUD numbers, titles) or nothing.
- **Windows:** one frame for every window (`drawPanel`): dark outline, bone border, gold corner rivets, navy field with a lighter top band.
- **Scaling:** the game draws at 256x224 into an offscreen buffer, then copies it to the screen at a whole-number scale; the browser smooths only the last fraction. One-pixel lines and letters stay intact at any window or iPad size.
- **HUD:** A Link to the Past's layout over a soft shade: a bone-framed rune vial, framed item box, outlined counters, hearts on dark backing under "- LIFE -".
- **Dialogue:** name plate tab, speaker portrait (Jon, Owen, villagers, the Penguin King, the Forest Giant), bouncing gold advance arrow.
- **Menus:** one tab strip (GEAR, JON, MAP, MUSIC, SPELLS, BAG) across all six pages.
- **Title:** aurora borealis over a fjord, two mountain ranges, a longship crossing the water, a three-times-scale outlined logo.
- **World:** the lake has an organic shoreline; palace ice catches moving glints.
