# Jöntuka: A Viking Tale — a critics' review (November 2026)

A self-review in the style of a review aggregator: one playthrough, five critics' points of view, and an honest account of what separates this game from a 90. The scores are Claude's judgment, not real outlets.

## The playthrough

A bot played Owen's nine pages from a new save using the game's own inputs (now `tests/playthrough_test.js`): Owen's room, Flight 364, Astrid, the subway, the exchange machine, the taxi, the log, the Forest Giant, the palace. The rest (the palace's rooms, the Penguin King, the Drowned Barrow, Hank, the side content) was covered by a screen-by-screen tour and the existing suites, not by continuous play.

| Measure | Result |
|---|---|
| Dialogue lines, pages 1 to 9 | 135 |
| Estimated time for a reader | about 11 minutes (7 reading, 4 playing) |
| Hearts lost (of 3) | 3.5, almost all in the giant fight |
| Game overs | 0 |
| Errors | 0 |

What the playthrough found, all fixed in this pass:

- **Owen's page 5 could be skipped.** The Muck Forest was reachable on foot through the Foothills, so the subway, the exchange machine and the taxi never had to happen. Deep muck now blocks that walk until the first taxi ride; after it, the walk is a shortcut.
- **Owen could get wedged against the plane.** One pixel into the hull, diagonal movement could not free him. He now slides out of any wall he overlaps.
- **Overlays piled up.** Floating words printed on top of each other, and a banner said TO BE CONTINUED in the middle of the game.

## Scores before this pass

| Critic | Cares most about | Score | In a sentence |
|---|---|---|---|
| The mainstream reviewer | Charm, story, set pieces | 82 | Jon is one of the funniest sidekicks of the year, and the giant you talk your way past is a great idea; it just stops. |
| The design critic | Mechanics, pacing, structure | 76 | Beat-timed chops and a rhythm duel are real ideas, but the game never ends and never tells you how much of it you have seen. |
| The retro specialist | Authenticity, craft | 85 | Mode 7, scanline effects, an echo chip and a pixel font built by hand; the 16-bit look is earned. |
| The family reviewer | Accessibility, frustration | 74 | Easy mode is welcome, but there is no way to slow text down, stop the screen shaking, or learn the buttons inside the game. |
| The hard-nosed critic | Length, polish, value | 72 | Three chapters of five, no credits, and the story's own subway chapter can be skipped by accident. |
| **Average** | | **78** | |

## What a 90 has that this did not

| What 90+ games do | Before | Now |
|---|---|---|
| End properly | A banner, then nothing | Credits: written by Owen, the cast, your stats, a rank from Jon, and what comes next |
| Show how much there is and reward finding it | Counters spread over menu pages | Jon's Trophy Wall: 24 trophies, 5 of them secret, a completion percent |
| Teach controls where they are needed | A key list under the screen, hidden on touch | A button prompt over anything Owen can talk to or read; first-time hints for walking, looking, fighting and the menu |
| Respect the player's time | Every line of every scene, every time | Hold THROW to fast-forward a conversation; three text speeds |
| Options and accessibility | Easy/Normal and sound | An options screen: text speed, screen shake, flash strength, notes, sound, music, TV filter |
| Never soft-lock | One wedge spot found | Owen slides out of walls; the playthrough is a test |
| Keep the story on its rails | Page 5 skippable | Page 5 is how you reach the forest |

## Scores after

| Critic | Before | After | Why |
|---|---|---|---|
| The mainstream reviewer | 82 | 85 | It ends now, and the ending credits the right person |
| The design critic | 76 | 83 | Completion is visible; the sequence break is closed |
| The retro specialist | 85 | 86 | Little changed for this critic |
| The family reviewer | 74 | 85 | Prompts, options and fast-forward are what this critic asked for |
| The hard-nosed critic | 72 | 79 | More polish, same length |
| **Average** | **78** | **84** | |

## What still stands between 84 and 90

These are not polish, and three of them are not Claude's to add.

1. **The story is unfinished.** Chapters 4 and 5 and the ending are Owen's to write. No great game is 60% of a story.
2. **The dungeons are thin.** Jjorvic Palace and the Drowned Barrow have keys, a switch, ice and one dash puzzle each. The classics this game is modelled on build a dungeon around its item for an hour.
3. **Nobody has watched a child play it.** Every difficulty number is a guess from code and a bot. One session of Owen playing while someone takes notes is worth more than this document.
4. **The art and music are generated.** They are consistent and charming, but a 90 usually has a human's hand in at least one of them. Owen's own drawings on the cards (already supported) are the cheapest way there.
5. **It has only been run in a desktop browser engine.** It is meant for an iPad.

## Second pass (the same week): Owen's page 10, and the dungeon

Owen's page 10 arrived: an elf the size of a lawn chair who says Chilly has already been slain. It is the best twist in the story so far, and it is built as written. His elf's one line, "How can I be of service?", also became the answer to two of the gaps above.

| Gap | What changed |
|---|---|
| The dungeons are thin | Jjorvic Palace gained a ninth room, housekeeping, with a sliding ice-block puzzle (a wrong push can jam it; stepping out resets it). Its reward, the Ice Skates, changes how the rest of the palace plays. |
| A child can get lost in a dungeon | The elf is the palace's concierge: ask, and they give one hint for wherever you are. The MAP page shows the palace's floor plan, with rooms you haven't entered, unopened chests and bosses. |

| Critic | First pass | Second pass | Why |
|---|---|---|---|
| The mainstream reviewer | 85 | 87 | The elf scene; a twist worth talking about |
| The design critic | 83 | 86 | A real puzzle, a dungeon map, an item that changes movement |
| The retro specialist | 86 | 87 | A floor plan and a block puzzle are exactly the genre |
| The family reviewer | 85 | 87 | A hint is always one conversation away |
| The hard-nosed critic | 79 | 81 | Still three chapters of five |
| **Average** | **84** | **86** | |

It is not a 90, and more features will not make it one. The remaining four points are the same list: Owen's chapters 4 and 5 and an ending; a second dungeon built with this much care (the Drowned Barrow has not had this pass); a session of a child playing it with someone watching; and a run on a real iPad.

## Third pass: the Drowned Barrow, and getting it onto Owen's iPad

Two of the four remaining gaps were things code could close, so they were worked.

| Gap | What changed |
|---|---|
| A second dungeon built with the palace's care | The Barrow has an eighth room, the bell crypt, north of the big key. Three spirit bells hang over the water between four islands. Only the Voodoo Dash can touch them, a dash across a gap rings the bell over it, and they must ring little, middle, big. The obvious route rings the big one second, so the answer is to go back and around. The reward, the Spirit Bell charm, halves the dash's wait. |
| A child can get lost in a dungeon | Fluffy is the Barrow's guide. He says "Woof!" and Jon translates one hint for wherever you are, in the entrance and in the crypt. The floor plan on the MAP page marks him. |
| It has only been run in a desktop browser engine | The page is now a whole document with a tablet viewport and home-screen metadata. Touch devices open straight into the fill-the-window layout with the thumbstick and buttons. Add to Home Screen makes it a full-screen app with its own icon, and it opens with no internet after one online visit. A closed OWEN'S SCRIPT panel was being drawn over the top of the full-window layout; that is fixed. |

| Critic | Second pass | Third pass | Why |
|---|---|---|---|
| The mainstream reviewer | 87 | 87 | Nothing new in the story |
| The design critic | 86 | 88 | Both dungeons now have a puzzle built on their item |
| The retro specialist | 87 | 88 | A bell-order room is the genre |
| The family reviewer | 87 | 88 | A hint-giver in each dungeon; it opens like an app |
| The hard-nosed critic | 81 | 82 | Still three chapters of five |
| **Average** | **86** | **87** | |

These are one reviewer's numbers, not outlets'. What is left is not code. Owen's chapters 4 and 5 and the ending. A session of Owen playing while someone watches where he gets stuck. And the iPad work above has been checked in an emulated iPad only: Chromium with touch, not Safari. Sound unlocking, the home-screen app and the offline copy are built to Safari's documented behaviour and have not been seen on the device. The first ten minutes on Owen's iPad are the test. One more thing found on the way: the free host behind Owen's link (raw.githack.com) now shows its own notice page with an advertisement before the game, about once a day. The repo is ready for GitHub Pages, which has no such page; switching it on is a setting only the repo's owner can change.
