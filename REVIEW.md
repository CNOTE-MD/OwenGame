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
| Show how much there is and reward finding it | Counters spread over menu pages | Jon's Trophy Wall: 22 trophies, 5 of them secret, a completion percent |
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
