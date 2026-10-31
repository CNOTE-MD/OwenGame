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

## Engine (October 2026 technical pass)

- **Fixed timestep:** the simulation advances in 1/60 s steps from an accumulator (`runFrame` in `web/src/tech.js`), at most 6 per display frame, so 30, 60, 120 and 144 Hz displays play identically. Input edges are consumed by the first step that runs; a frame with no step keeps them. Negative or huge frame gaps are clamped.
- **Mode 7:** the taxi ride is a perspective-mapped ground plane rendered scanline by scanline from an 8-texel-per-tile texture of the real overworld, with a banded sky, a mountain range that turns with the camera, and distance haze.
- **HDMA-style scanline effects:** per-row horizontal offsets for heat haze on the volcano road and a dream wobble in the nightmare (stronger during blackouts).
- **Transitions:** an iris wipe centred on Owen when entering buildings and dungeons; a mosaic dissolve when stepping out to the world; a mosaic on the way to the game-over screen.
- **Audio:** music runs through an SPC700-style echo (delay, feedback, low-pass): almost dry outdoors, wet in the palace, barrow and dungeons, very wet in the nightmare.
- **Display:** an optional CRT filter (Y) with scanlines and a tube vignette, drawn on the presented image only. A developer overlay (` or F3) shows fps, frame time, sim steps, state, map, entities, particles, prescale, effects and echo.

## Owen's systems (October 2026)

- **OWEN'S SCRIPT:** a writer's notebook under the game screen. Every scene of dialogue is listed; Owen changes any line and it plays in the game right away. Edits live in the page's shared database, so they follow him to any device and Claude can read them when building the next chapter. The Chapter 4 tab is where he writes Walter's Forge page by page; the forge door plays his pages once Hank is freed. Each scene can carry an optional note (director's commentary) that shows on notebook paper after the scene. A Notebook tab pins photos of his real pages to chapter and boss cards.
- **Difficulty:** Easy halves damage, lengthens boss openings by 40% and brings Jon's compliments faster. Chosen on the title screen or the gear page (X), remembered between games.
- **Songs and the beat:** each rune Owen finds is also a song Jon remembers. Outdoor music starts as bass and kick and fills back in, layer by layer, as songs return. A beat marker on the HUD pulses with the music's own clock; a chop on the beat hits 1.5x, and bosses start their big moves on the beat.
- **Night:** Chilly can't walk in daylight, so his creatures get bolder after dark (faster, better drops). Owen's own grave appears on the beach at night. Talking to a runestone twice rests until nightfall or morning.

## Owen's Quest Log, Rune 5 (built October 2026)

- **Possessed animals (Q41):** the wombat waddles, digs in, tunnels under Owen and bursts up, then sits dazed; its rump is armour, so chop the face. The squirrel zigzags, freezes and flings acorns. Carolina dogs circle as a pack and only one darts in at a time, after a YIP. Beaten animals are freed, not killed: Chilly's purple sparks pop off and the animal hops home with a heart. Freeing two squirrels leaves their stash, a heart piece.
- **The Peanut Butter Lion (Q42):** asleep on the beach where Owen died. It prowls, crouches (a ring marks where it will land), pounces and lands stuck in its own peanut butter: that's the opening, the only time it takes full damage. It roars globs that leave sticky puddles, which slow Owen to 45%. At half health it melts down to a fast cub. Melted, it leaves a heart piece and stays melted. The fight plays the Aerosmith-sound piece.
- **The throne riddle (Q44):** after Owen sits on Chilly's throne, looking again finds a riddle in the armrest, with four answers to pick from (and "Not now"). Wrong costs nothing and swaps in the next riddle; right opens a drawer with a heart piece. The choice menu (`ask()`) is reusable for anything else that asks.
- **Chilly's arch-enemy (Q43):** Baron Blubber, a walrus in a towel and monocle (placeholder name until Owen picks one), lives in a sauna by the volcano so Chilly can't freeze it again. His door is under a bush beside a NO PENGUINS sign on the Volcano Road. He does not help. He is just mad at Chilly. His trophy case holds a heart piece he stole from Chilly.
- **Heart pieces:** eight now (forest, grave, cave, Bjarne, squirrel stash, lion, riddle, Baron), so two full hearts.

