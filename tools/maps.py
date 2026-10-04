"""Map designer for the browser build. Run: python3 tools/maps.py  -> writes web/src/maps.js
Each screen is 16x14 tiles (one SNES screen). Edit the ASCII below; the checker verifies everything is reachable.

Tile legend
  .  grass        f flowers      s path/sand    n snow         i ice floor (slippery)
  T  tree         b bush (cut)   # rock         M cliff        O pot (break)
  ~  lake (Jon rockets you out)  w deep water   U bridge       x fence
  R  roof         H house wall   D house door   P plane body   q plane wing
  E  cave entrance               X sealed rune door (read it)  + gravestone
  l  lava         _ dungeon floor   W dungeon wall   v pit     t torch
  L  locked door (small key)     K boss door (big key)   h shutter   G gate (lowered by switch)
  F  wood floor   Z interior wall   Y bed   Q table   r rug   d doorway
  a  arena floor  V  arena wall
  k  bookshelf    p  fireplace   C  cave rock   g  cave floor   >  stairs down   <  stairs up
  y  spirit barrier (only Voodoo Dash passes)
  u  plane wall   e  emergency light   =  cargo grate   m  cabin carpet   A  seat   J  phantom seat (appears in blackouts)   B  crate
"""
import json, collections, pathlib

SW, SH = 16, 14

def check_block(name, block):
    assert len(block) == SH, (name, len(block))
    for i, r in enumerate(block):
        assert len(r) == SW, (name, i, r, len(r))

# ---------------- Overworld: 4 x 3 screens ----------------
OW = {}
OW[(0, 0)] = [  # Foothills: sealed Drowned Barrow (dungeon 2)
    "TTTTTTTTTTTTTTTT",
    "TMMMMMMMMMMMMMMT",
    "TMMMMMMXMMMMMMMT",
    "T......s.......T",
    "T..T...s...b...T",
    "T......s........",
    "T..b...sssssssss",
    "T......s........",
    "T.T....s....T...",
    "T......s.....b.T",
    "T.bb...s.......T",
    "T......s..T....T",
    "T......s.......T",
    "TTTTTT.s..TTTTTT",
]
OW[(1, 0)] = [  # Whispering Forest: heart piece in the bush ring
    "TTTTTTTTTTTTTTTT",
    "TTT..T....T..TTT",
    "T....b..T...bbbT",
    "T.T.......T.b.bT",
    "T....TT.....bbbT",
    "........T.......",
    "ssssssssssssssss",
    "......f.........",
    "..T......TT.....",
    "T....b.......T.T",
    "T..TT....b.....T",
    "T.......T...T..T",
    "TT..b..........T",
    "TTTTTT.s..TTTTTT",
]
OW[(2, 0)] = [  # Frozen Path: Penguin Ice Cavern (dungeon 1)
    "TTTTTTTTTTTTTTTT",
    "TMMMMMMMMMMMMMMT",
    "TMMMMMMEMMMMMMMT",
    "Tnnnnnnsnnnnnn#T",
    "TnTnnnnsnnnnnnnT",
    "nnnnnnnsnnnTnnnn",
    "sssssssssnnnnnnn",
    "nnnnnnnsnnnnnnnn",
    "nnTnnnnsnnnn#nnn",
    "Tnnnnnnsnnnnnn#T",
    "Tnn#nnnsnnnTnnnT",
    "TnnnnnnsnnnnnnnT",
    "TnnnnnTsnnnnnnnT",
    "TTTTTT.s..TTTTTT",
]
OW[(3, 0)] = [  # Storm Peak base: sealed (dungeon 4)
    "TTTTTTTTTTTTTTTT",
    "TMMMMMMMMMMMMMMT",
    "TMMMMMMXMMMMMMMT",
    "TnnnnnnsnnnnnnnT",
    "Tnn#nnnsnnnnTnnT",
    "nnnnnnnsnnnnnnnT",
    "nnnnnnnsnnnnnnnT",
    "nnnnnnnsnn#nnnnT",
    "nnnnnnnsnnnnnnnT",
    "TnnTnnnsnnnnnnnT",
    "TnnnnnnsnnnnnTnT",
    "Tnnn#nnsnnnnnnnT",
    "TnnnnnnsnnnnnnnT",
    "TTTTTT.s..TTTTTT",
]
OW[(0, 1)] = [  # Fjordvik west: Elder Astrid's house
    "TTTTTT.s..TTTTTT",
    "T......s.......T",
    "T.RRRRR.s......T",
    "T.RRRRR.s..RRRRT",
    "T.HHDHH.s..RRRRT",
    "T.......s..HHDHT",
    "T.ff....ssssssss",
    "T.......s.......",
    "T..x.x..s..f....",
    "T.......s.......",
    "T..b....s....b.T",
    "T.......s......T",
    "T.......s......T",
    "TTTTTT.s..TTTTTT",
]
OW[(1, 1)] = [  # Fjordvik market: Lars's stall
    "TTTTTT.s..TTTTTT",
    "T......s.......T",
    "T..RRRRRR......T",
    "T..RRRRRR...f..T",
    "T..HHHHHH......T",
    "T..xQ.Q.Qx......",
    "sssssssssssssss.",
    "........s.......",
    "...f....s.......",
    "T.......s....b.T",
    "T..b....s......T",
    "T.......s......T",
    "T.......s......T",
    "TTTTTT.s..TTTTTT",
]
OW[(2, 1)] = [  # Lake Jontuka, north shore
    "TTTTTT.s..TTTTTT",
    "T.....ss.......T",
    "T..sssssssssss.T",
    "T..s~~~~~~~~~s.T",
    "T..s~~~~~~~~~s.T",
    "...s~~~~~~~~~s..",
    "ssss~~~~~~~~~sss",
    "...s~~~~~~~~~s..",
    "...s~~~~~~~~~s..",
    "T..s~~~~~~~~~s.T",
    "T..sssssssssss.T",
    "T......s.......T",
    "T..T...s....T..T",
    "TTTTTT.s..TTTTTT",
]
OW[(3, 1)] = [  # Volcano road: sealed Walter's Forge (dungeon 3)
    "TTTTTT.s..TTTTTT",
    "T#.....s....lllT",
    "T..#...s...lMMMT",
    "T......s...lMXMT",
    "T....#.s...lMsMT",
    ".......s....ss.T",
    "ssssssssssssss.T",
    ".......s.......T",
    "...#...s...#...T",
    "T......s.......T",
    "T.#....s....#..T",
    "T......s.......T",
    "T......s..#....T",
    "TTTTTT.s..TTTTTT",
]
OW[(0, 2)] = [  # Fjord coast: Ingrid the fisher
    "TTTTTT.s..TTTTTT",
    "T......s.......T",
    "T..b...s.......T",
    "T......s...f...T",
    "T......s.......T",
    "T......s........",
    "T......sssssssss",
    "Twwwww.s........",
    "TwwwwwUUU......T",
    "Twwwwwwww.b....T",
    "TwwwwwwwwwT....T",
    "TwwwwwwwwwwT...T",
    "TwwwwwwwwwwwT..T",
    "TTTTTTTTTTTTTTTT",
]
OW[(1, 2)] = [  # Fjordvik airstrip: Flight 364 (demon side quest hook)
    "TTTTTT.s..TTTTTT",
    "T......s.......T",
    "T......s.......T",
    "T......s..qq...T",
    "T.PPPPPPPPPPPP.T",
    "..PPPPPPPPPPPP..",
    "sssssssssqqssss.",
    "..........s.....",
    "....ssssssss....",
    "T..............T",
    "T..b....f......T",
    "T......T.......T",
    "T..........b...T",
    "TTTTTTTTTTTTTTTT",
]
OW[(2, 2)] = [  # The Beach Where I Died
    "TTTTTT.s..TTTTTT",
    "T..ss..s..ss...T",
    "T.sssssssssss..T",
    "T.sssssssssss..T",
    "T.sssssssssss..T",
    "..sssssssssss...",
    "sssssssssssssss.",
    "..sssssssssss...",
    "T.sssssssssss..T",
    "T.sssssssssss..T",
    "T..sssssssss...T",
    "T..............T",
    "T..T......T....T",
    "TTTTTTTTTTTTTTTT",
]
OW[(3, 2)] = [  # Old graveyard: heart piece among the graves
    "TTTTTT.s..TTTTTT",
    "T......s.......T",
    "T.+.+.+s+.+.+..T",
    "T......s.......T",
    "T.+.+.+s+.+.+..T",
    ".......s.......T",
    "sssssssss......T",
    "T......s.......T",
    "T.+.+..s..+.+..T",
    "T......s.......T",
    "T.+.+..s..+.+.+T",
    "T......s.......T",
    "T..............T",
    "TTTTTTTTTTTTTTTT",
]

def compose(blocks, cols, rows):
    grid = [["T"] * (cols * SW) for _ in range(rows * SH)]
    for (sx, sy), b in blocks.items():
        check_block((sx, sy), b)
        for y, r in enumerate(b):
            for x, c in enumerate(r):
                grid[sy * SH + y][sx * SW + x] = c
    H, W = len(grid), len(grid[0])
    for x in range(W):
        grid[0][x] = "T" if grid[0][x] not in "TMw" else grid[0][x]
        grid[H - 1][x] = "T" if grid[H - 1][x] not in "TMw" else grid[H - 1][x]
    for y in range(H):
        if grid[y][0] not in "TMw": grid[y][0] = "T"
        if grid[y][W - 1] not in "TMw": grid[y][W - 1] = "T"
    return grid

ow = compose(OW, 4, 3)

# Thicken the outer forest to two tiles so it renders as big 2x2 trees (A Link to the Past style).
def thicken(grid, ents):
    H, W = len(grid), len(grid[0])
    busy = {tuple(e["at"]) for e in ents}
    def soft(x, y):
        return grid[y][x] in ".f" and (x, y) not in busy
    for x in range(W):
        if grid[0][x] == "T" and soft(x, 1): grid[1][x] = "T"
        if grid[H - 1][x] == "T" and soft(x, H - 2): grid[H - 2][x] = "T"
    for y in range(H):
        if grid[y][0] == "T" and soft(1, y): grid[y][1] = "T"
        if grid[y][W - 1] == "T" and soft(W - 2, y): grid[y][W - 2] = "T"

def P(sx, sy, x, y):  # screen-local tile -> global tile
    return [sx * SW + x, sy * SH + y]

OW_ENT = [
    {"t": "start", "at": P(1, 2, 8, 8)},
    {"t": "runestone", "at": P(1, 2, 4, 8)},
    {"t": "sign", "at": P(1, 2, 12, 8), "text": "sign_airstrip"},
    {"t": "cargo", "at": P(1, 2, 13, 5)},
    {"t": "npc", "id": "astrid", "at": P(0, 1, 5, 6)},
    {"t": "npc", "id": "lars", "at": P(1, 1, 7, 5)},
    {"t": "shop", "item": "juice", "price": 40, "at": P(1, 1, 4, 5)},
    {"t": "shop", "item": "shard", "price": 25, "at": P(1, 1, 6, 5)},
    {"t": "shop", "item": "heart3", "price": 10, "at": P(1, 1, 8, 5)},
    {"t": "npc", "id": "sven", "at": P(1, 1, 12, 9)},
    {"t": "npc", "id": "ingrid", "at": P(0, 2, 9, 8)},
    {"t": "sign", "at": P(0, 1, 10, 7), "text": "sign_fjordvik"},
    {"t": "runestone", "at": P(2, 0, 10, 4)},
    {"t": "sign", "at": P(2, 0, 9, 3), "text": "sign_cavern"},
    {"t": "sealed", "at": P(0, 0, 7, 2), "text": "seal_barrow", "opensWith": "d1done"},
    {"t": "runedoor", "at": P(0, 0, 7, 2), "needs": "d1done", "to": "barrow", "dest": [24, 40]},
    {"t": "sealed", "at": P(3, 0, 7, 2), "text": "seal_peak"},
    {"t": "sealed", "at": P(3, 1, 13, 3), "text": "seal_forge"},
    {"t": "sign", "at": P(2, 2, 6, 9), "text": "sign_beach"},
    {"t": "warp", "at": P(2, 0, 7, 2), "to": "cavern", "dest": [24, 54]},
    {"t": "door", "at": P(0, 1, 4, 4), "to": "astrid_house", "dest": [7, 12]},
    {"t": "door", "at": P(0, 1, 13, 5), "to": "bjarne_house", "dest": [7, 12]},
    {"t": "qitem", "id": "sheet", "at": P(2, 2, 11, 9), "needs": "quest_bjarne"},
    {"t": "qitem", "id": "ship", "at": P(1, 0, 5, 9), "needs": "quest_sven", "underBush": True},
    {"t": "grave", "at": P(3, 2, 13, 8)},
    {"t": "stairs", "at": P(3, 2, 13, 8), "to": "secret_cave", "dest": [8, 11]},
    {"t": "piece", "id": "hp_forest", "at": P(1, 0, 13, 3)},
    {"t": "piece", "id": "hp_grave", "at": P(3, 2, 13, 11)},
    {"t": "chest", "id": "c_coast", "at": P(0, 2, 14, 2), "item": "kr20"},
    # enemies
    {"t": "penguin", "at": P(2, 2, 5, 3)}, {"t": "penguin", "at": P(2, 2, 10, 4)}, {"t": "penguin", "at": P(2, 2, 7, 8)},
    {"t": "penguin", "at": P(2, 0, 4, 7)}, {"t": "penguin", "at": P(2, 0, 12, 9)},
    {"t": "penguin", "at": P(3, 0, 10, 6)}, {"t": "wisp", "at": P(3, 0, 5, 10)},
    {"t": "draugr", "at": P(1, 0, 4, 8)}, {"t": "wisp", "at": P(1, 0, 11, 10)},
    {"t": "draugr", "at": P(3, 2, 4, 5)}, {"t": "draugr", "at": P(3, 2, 11, 9)}, {"t": "wisp", "at": P(3, 2, 7, 11)},
    {"t": "wisp", "at": P(0, 0, 10, 9)}, {"t": "penguin", "at": P(0, 0, 4, 11)},
    {"t": "draugr", "at": P(3, 1, 9, 9)}, {"t": "wisp", "at": P(3, 1, 4, 3)},
    {"t": "penguin", "at": P(2, 1, 1, 9)},
]

# ---------------- Penguin Ice Cavern: 3 x 4 rooms ----------------
def room(top=None, bottom=None, left=None, right=None, side_rows=(6, 7), floor="_"):
    g = [["W"] * SW for _ in range(SH)]
    for y in range(1, SH - 1):
        for x in range(1, SW - 1):
            g[y][x] = floor
    if top: g[0][7] = g[0][8] = top
    if bottom: g[SH - 1][7] = g[SH - 1][8] = bottom
    if left:
        for y in side_rows: g[y][0] = left
    if right:
        for y in side_rows: g[y][SW - 1] = right
    for (x, y) in [(1, 1), (14, 1), (1, 12), (14, 12)]:
        g[y][x] = "t"
    return g

def put(g, x0, y0, rows):
    for dy, r in enumerate(rows):
        for dx, c in enumerate(r):
            if c != " ": g[y0 + dy][x0 + dx] = c

R = {}
low = (9, 10)
R[(1, 3)] = room(top="_", bottom="_")                          # entrance
R[(1, 2)] = room(top="L", bottom="_", left="_", right="_")      # hub (ice)
put(R[(1, 2)], 3, 3, ["iiiiiiiiii"] * 8)
R[(0, 2)] = room(right="_")                                     # west: bats + pots, key on clear
put(R[(0, 2)], 2, 2, ["O  O", "", "", "", "", "", "", "O  O"])
R[(2, 2)] = room(left="_")                                      # east: pit maze, key chest
put(R[(2, 2)], 2, 2, [
    "vvvvvvvvvv_v",
    "vvvvvvvvvv_v",
    "vvv________v",
    "vvv_vvvvvvvv",
    "____vvvv____",
    "____vvvvvvvv",
    "vvvvvvvvvvvv",
    "vvvvvvvvvvvv",
])
R[(1, 1)] = room(top="K", bottom="h", left="_", right="L", side_rows=low)   # switch room
put(R[(1, 1)], 1, 3, ["vvvvvvGGvvvvvv"] * 5)
R[(0, 1)] = room(right="_", side_rows=low)                      # NW: draugr, big key on clear
R[(2, 1)] = room(left="h", side_rows=low)                       # mini-boss: Penguin Knight
put(R[(2, 1)], 3, 3, ["iiiiiiiiii"] * 8)
R[(1, 0)] = room(bottom="h")                                    # boss: Penguin King
put(R[(1, 0)], 2, 2, ["iiiiiiiiiiii"] * 10)
# hub's top door is the locked door; the switch room's bottom is its far side
R[(1, 1)][SH - 1][7] = R[(1, 1)][SH - 1][8] = "L"
R[(1, 2)][0][7] = R[(1, 2)][0][8] = "L"
# switch-room right door locked, mini-boss side shutter
# boss door K is on the switch room's top; boss room bottom is a shutter

cav_blocks = {k: ["".join(r) for r in v] for k, v in R.items()}
for y in range(4):
    for x in range(3):
        if (x, y) not in cav_blocks:
            cav_blocks[(x, y)] = ["W" * SW] * SH
cav = [["W"] * (3 * SW) for _ in range(4 * SH)]
for (sx, sy), b in cav_blocks.items():
    check_block(("cav", sx, sy), b)
    for y, r in enumerate(b):
        for x, c in enumerate(r):
            cav[sy * SH + y][sx * SW + x] = c

CAV_ENT = [
    {"t": "warp", "at": P(1, 3, 7, 13), "to": "overworld", "dest": P(2, 0, 7, 3)},
    {"t": "warp", "at": P(1, 3, 8, 13), "to": "overworld", "dest": P(2, 0, 7, 3)},
    {"t": "runestone", "at": P(1, 3, 4, 6)},
    {"t": "sign", "at": P(1, 3, 10, 6), "text": "sign_cavern_in"},
    {"t": "penguin", "at": P(1, 2, 5, 5)}, {"t": "penguin", "at": P(1, 2, 10, 5)}, {"t": "penguin", "at": P(1, 2, 8, 9)},
    {"t": "bat", "at": P(0, 2, 5, 5)}, {"t": "bat", "at": P(0, 2, 10, 8)}, {"t": "bat", "at": P(0, 2, 7, 10)},
    {"t": "chest", "id": "cv_key1", "at": P(0, 2, 7, 6), "item": "key", "clear": True},
    {"t": "bat", "at": P(2, 2, 12, 4)}, {"t": "bat", "at": P(2, 2, 4, 11)},
    {"t": "chest", "id": "cv_key2", "at": P(2, 2, 12, 2), "item": "key"},
    {"t": "switch", "id": "cv_gate", "at": P(1, 1, 2, 1)},
    {"t": "draugr", "at": P(0, 1, 5, 4)}, {"t": "draugr", "at": P(0, 1, 10, 8)}, {"t": "penguin", "at": P(0, 1, 7, 11)},
    {"t": "chest", "id": "cv_bigkey", "at": P(0, 1, 7, 6), "item": "bigkey", "clear": True},
    {"t": "knight", "at": P(2, 1, 9, 5)},
    {"t": "chest", "id": "cv_homing", "at": P(2, 1, 8, 7), "item": "homing", "clear": True},
    {"t": "king", "at": P(1, 0, 8, 5)},
    {"t": "chest", "id": "cv_thunder", "at": P(1, 0, 8, 4), "item": "thunder", "clear": True},
    {"t": "container", "id": "hc_cavern", "at": P(1, 0, 6, 7), "clear": True},
    {"t": "warp", "at": P(1, 0, 10, 7), "to": "overworld", "dest": P(2, 0, 7, 4), "clear": True, "portal": True},
]


# ---------------- Chapter 2: the Drowned Barrow, 3 x 3 rooms ----------------
BR = {}
BR[(1, 2)] = room(top="L", bottom="_", left="_", right="_")                       # entrance
put(BR[(1, 2)], 2, 9, ["ww", "ww"]); put(BR[(1, 2)], 12, 9, ["ww", "ww"])
BR[(0, 2)] = room(right="_")                                                       # west: key on clear
put(BR[(0, 2)], 3, 3, ["w  w", "", "", "", "", "", "w  w"])
BR[(2, 2)] = room(left="_")                                                        # east: flooded, dash for the far side
put(BR[(2, 2)], 9, 1, ["ww"] * 12)
BR[(1, 1)] = room(top="K", bottom="L", left="_", right="y")                        # great hall: channel splits it
put(BR[(1, 1)], 1, 4, ["wwwwwwwwwwwwww", "wwwwwwwwwwwwww"])
BR[(0, 1)] = room(right="h")                                                       # mini-boss: Draugr Captain
BR[(2, 1)] = room(left="_")                                                        # big key across the pits
put(BR[(2, 1)], 5, 1, ["vv"] * 12)
BR[(1, 0)] = room(bottom="h")                                                      # Hank's ghost
put(BR[(1, 0)], 1, 1, ["ww", "w"]); put(BR[(1, 0)], 13, 1, ["ww", " w"]); put(BR[(1, 0)], 1, 11, ["w", "ww"]); put(BR[(1, 0)], 13, 11, [" w", "ww"])
BR[(1, 2)][0][7] = BR[(1, 2)][0][8] = "L"
br_blocks = {k: ["".join(r) for r in v] for k, v in BR.items()}
br = [["W"] * (3 * SW) for _ in range(3 * SH)]
for (sx, sy), b in br_blocks.items():
    check_block(("barrow", sx, sy), b)
    for y, r in enumerate(b):
        for x, c in enumerate(r):
            br[sy * SH + y][sx * SW + x] = c
# the spirit barrier only on the hall side of the east door
br[1 * SH + 6][2 * SW + 0] = br[1 * SH + 7][2 * SW + 0] = "_"
BR_ENT = [
    {"t": "warp", "at": P(1, 2, 7, 13), "to": "overworld", "dest": P(0, 0, 7, 3)},
    {"t": "warp", "at": P(1, 2, 8, 13), "to": "overworld", "dest": P(0, 0, 7, 3)},
    {"t": "runestone", "at": P(1, 2, 4, 6)},
    {"t": "npc", "id": "fluffy", "at": P(1, 2, 10, 6)},
    {"t": "draugr", "at": P(0, 2, 5, 5)}, {"t": "draugr", "at": P(0, 2, 10, 9)}, {"t": "wisp", "at": P(0, 2, 8, 3)},
    {"t": "chest", "id": "br_key", "at": P(0, 2, 7, 6), "item": "key", "clear": True},
    {"t": "bat", "at": P(2, 2, 4, 4)}, {"t": "bat", "at": P(2, 2, 5, 10)},
    {"t": "chest", "id": "br_kr", "at": P(2, 2, 13, 6), "item": "kr50"},
    {"t": "draugr", "at": P(1, 1, 5, 9)}, {"t": "wisp", "at": P(1, 1, 10, 2)},
    {"t": "captain", "at": P(0, 1, 6, 6)},
    {"t": "chest", "id": "br_dash", "at": P(0, 1, 8, 6), "item": "dash", "clear": True},
    {"t": "wisp", "at": P(2, 1, 11, 3)}, {"t": "bat", "at": P(2, 1, 12, 10)},
    {"t": "chest", "id": "br_bigkey", "at": P(2, 1, 12, 6), "item": "bigkey"},
    {"t": "hank", "at": P(1, 0, 8, 5)},
    {"t": "container", "id": "hc_barrow", "at": P(1, 0, 6, 9), "clear": True},
    {"t": "warp", "at": P(1, 0, 10, 9), "to": "overworld", "dest": P(0, 0, 7, 4), "clear": True, "portal": True},
]

# ---------------- Owen's room (New York) ----------------
HOME = [
    "ZZZZZZZZZZZZZZZZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFYYFFFFFFFQQQFZ",
    "ZFYYFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFrrrrrFFFFFZ",
    "ZFFFFrrrrrFFFFFZ",
    "ZFFFFrrrrrFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFQFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZZZZZZZddZZZZZZZ",
]
check_block("home", HOME)
HOME_ENT = [
    {"t": "start", "at": [3, 4]},
    {"t": "plaque", "at": [12, 2]},
    {"t": "sign", "at": [2, 10], "text": "sign_poster"},
    {"t": "flight", "at": [7, 13]}, {"t": "flight", "at": [8, 13]},
]


# ---------------- Valhalla Arena: 2 x 2 screens, camera follows Owen ----------------
ARENA = [["a"] * 32 for _ in range(28)]
for x in range(32):
    ARENA[0][x] = ARENA[1][x] = ARENA[27][x] = "V"
for y in range(28):
    ARENA[y][0] = ARENA[y][31] = "V"
for (x, y) in [(7, 7), (24, 7), (7, 20), (24, 20), (15, 5), (16, 5), (15, 22), (16, 22)]:
    ARENA[y][x] = "#"
ARENA = ["".join(r) for r in ARENA]


# ---------------- Village interiors and the secret cave ----------------
ASTRID = [
    "ZZZZZZZZZZZZZZZZ",
    "ZkkFFFppFFFFkkFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFQQFFFFFFFFYYZ",
    "ZFFFFFFFFFFFFYYZ",
    "ZFFFFrrrrrrFFFFZ",
    "ZFFFFrrrrrrFFFFZ",
    "ZOFFFrrrrrrFFFOZ",
    "ZOFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZZZZZZZddZZZZZZZ",
]
ASTRID_ENT = [
    {"t": "sign", "at": [10, 0], "text": "tapestry"},
    {"t": "sign", "at": [2, 1], "text": "bookshelf"},
    {"t": "chest", "id": "c_astrid", "at": [14, 10], "item": "juice"},
    {"t": "warp", "at": [7, 13], "to": "overworld", "dest": P(0, 1, 4, 5)},
    {"t": "warp", "at": [8, 13], "to": "overworld", "dest": P(0, 1, 4, 5)},
]
BJARNE = [
    "ZZZZZZZZZZZZZZZZ",
    "ZkkFFFFFFFFFkkFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFFFFFFFFYYFZ",
    "ZFFQQQFFFFFFYYFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZFFFFrrrrrrFFFFZ",
    "ZFFFFrrrrrrFFFFZ",
    "ZFFFFrrrrrrFFFFZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZOFFFFFFFFFFFFOZ",
    "ZFFFFFFFFFFFFFFZ",
    "ZZZZZZZddZZZZZZZ",
]
BJARNE_ENT = [
    {"t": "npc", "id": "bjarne", "at": [7, 6]},
    {"t": "sign", "at": [10, 0], "text": "rush_poster"},
    {"t": "warp", "at": [7, 13], "to": "overworld", "dest": P(0, 1, 13, 6)},
    {"t": "warp", "at": [8, 13], "to": "overworld", "dest": P(0, 1, 13, 6)},
]
CAVE = [
    "CCCCCCCCCCCCCCCC",
    "CCCggggCCCggggCC",
    "CCggggggggggggCC",
    "CgggCCggggCCgggC",
    "CggggggggggggggC",
    "CggCgggOOgggCggC",
    "CgggggggggggggCC",
    "CCggggCCCCgggggC",
    "CCgggggCCgggggCC",
    "CgggggggggggOggC",
    "CggCCgggggggggCC",
    "CCgggggggggCCgCC",
    "CCCggggg<gggCCCC",
    "CCCCCCCCCCCCCCCC",
]
CAVE_ENT = [
    {"t": "chest", "id": "c_cave", "at": [5, 1], "item": "piece"},
    {"t": "bat", "at": [4, 4]}, {"t": "bat", "at": [11, 8]}, {"t": "wisp", "at": [12, 2]},
    {"t": "warp", "at": [8, 12], "to": "overworld", "dest": P(3, 2, 13, 9)},
    {"t": "sign", "at": [6, 7], "text": "cave_carving"},
]
for nm, g in (("astrid", ASTRID), ("bjarne", BJARNE), ("cave", CAVE)):
    check_block(nm, g)


# ---------------- The Red-Eye: Flight 364's cargo hold and cabin, 4 rooms in a row ----------------
RE = [["m"] * 64 for _ in range(14)]
for x in range(64):
    for y in (0, 1, 12, 13): RE[y][x] = "u"
for x in range(16): 
    for y in range(2, 12): RE[y][x] = "="
for bx in (15, 16, 31, 32, 47, 48):
    for y in range(14):
        if y not in (6, 7): RE[y][bx] = "u"
for x in (0,):
    for y in range(2, 12): RE[y][x] = "u"
RE[6][0] = RE[7][0] = "d"                         # hatch back out to the airstrip
for x in range(63, 64):
    for y in range(14): RE[y][x] = "u"
for x in (5, 24, 40, 52, 59): RE[1][x] = "e"; RE[12][x] = "e"
# cargo hold: crates
for (x, y) in [(4, 3), (5, 3), (4, 4), (9, 9), (10, 9), (10, 10), (12, 3), (12, 4), (7, 8), (3, 10), (13, 10)]: RE[y][x] = "B"
# rear cabin: seat rows above and below the aisle; phantom seats wait in the aisle
for x in range(18, 30, 2):
    for y in (2, 3, 4, 9, 10, 11): RE[y][x] = "A"
for (x, y) in [(21, 5), (21, 6), (25, 7), (25, 8), (28, 5)]: RE[y][x] = "J"
# galley: storage carts against the walls
for (x, y) in [(34, 2), (35, 2), (44, 2), (45, 2), (34, 11), (35, 11), (44, 11), (45, 11)]: RE[y][x] = "B"
# first class: a few seats for cover, a shutter behind you
for (x, y) in [(51, 3), (51, 4), (60, 3), (60, 4), (51, 9), (51, 10), (60, 9), (60, 10)]: RE[y][x] = "A"
RE[6][48] = RE[7][48] = "h"
RE = ["".join(r) for r in RE]
RE_ENT = [
    {"t": "warp", "at": [0, 6], "to": "overworld", "dest": P(1, 2, 13, 6)},
    {"t": "warp", "at": [0, 7], "to": "overworld", "dest": P(1, 2, 13, 6)},
    {"t": "imp", "at": [8, 4]}, {"t": "imp", "at": [11, 7]},
    {"t": "imp", "at": [23, 6]}, {"t": "imp", "at": [27, 7]}, {"t": "wisp", "at": [19, 6]},
    {"t": "cart", "at": [37, 3]}, {"t": "cart", "at": [42, 10]}, {"t": "imp", "at": [39, 6]}, {"t": "imp", "at": [44, 7]},
    {"t": "attendant", "at": [56, 6]},
    {"t": "container", "id": "hc_redeye", "at": [54, 7], "clear": True},
    {"t": "chest", "id": "c_horn", "at": [57, 7], "item": "horn", "clear": True},
    {"t": "warp", "at": [61, 7], "to": "overworld", "dest": P(1, 2, 13, 6), "clear": True, "portal": True},
]

# ---------------- reachability check ----------------
WALK = set(".fsn~iU_vrFDEhLKGtdg<>=m") - set("t")
def reachable(grid, start, extra=set()):
    H, W = len(grid), len(grid[0])
    seen = {tuple(start)}
    q = collections.deque([tuple(start)])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen:
                c = grid[ny][nx]
                if c in (WALK | extra) and c not in "~v" or c == "b":
                    seen.add((nx, ny)); q.append((nx, ny))
    return seen

thicken(ow, OW_ENT)
ow_seen = reachable(ow, OW_ENT[0]["at"])
for e in OW_ENT:
    x, y = e["at"]
    ok = any((x + dx, y + dy) in ow_seen for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)))
    assert ok, ("overworld unreachable", e)
cav_seen = reachable(cav, P(1, 3, 7, 12))
for e in CAV_ENT:
    x, y = e["at"]
    if e["t"] == "switch":  # across the chasm on purpose
        continue
    ok = any((x + dx, y + dy) in cav_seen for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)))
    assert ok, ("cavern unreachable", e)
for nm, g, ents, start in (("astrid", ASTRID, ASTRID_ENT, (7, 12)), ("bjarne", BJARNE, BJARNE_ENT, (7, 12)), ("cave", CAVE, CAVE_ENT, (8, 11))):
    seen = reachable([list(r) for r in g], start)
    for e in ents:
        x, y = e["at"]
        assert any((x + dx, y + dy) in seen for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))), (nm, "unreachable", e)
# the Barrow: without the dash you can reach the Captain (and his Voodoo Dash) but not the boss;
# with the dash everything is reachable
def br_reach(dash):
    g = [list(r) for r in br]
    for row in g:
        for i, c in enumerate(row):
            if c in "Ly" or (dash and c in "wvyK"): row[i] = "_"
    return reachable(g, P(1, 2, 7, 12))
no_dash, with_dash = br_reach(False), br_reach(True)
near = lambda seen, at: any((at[0] + dx, at[1] + dy) in seen for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)))
for e in BR_ENT:
    assert near(with_dash, e["at"]), ("barrow unreachable even with dash", e)
assert near(no_dash, P(0, 1, 8, 6)), "Voodoo Dash chest must be reachable without the dash"
assert not near(no_dash, P(1, 0, 8, 5)), "boss must need the dash"
assert not near(no_dash, P(2, 1, 12, 6)), "big key must need the dash"
# the Red-Eye must be passable with the phantom seats both gone and present
for phantom in (False, True):
    g = [list(r.replace("J", "A" if phantom else "m")) for r in RE]
    seen = reachable(g, (2, 7))
    for e in RE_ENT:
        x, y = e["at"]
        assert any((x + dx, y + dy) in seen for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))), ("redeye unreachable", phantom, e)
# the switch must be out of plain-throw range from the near side, in homing range
sw = CAV_ENT[[e["t"] for e in CAV_ENT].index("switch")]["at"]
near = [(x, y) for (x, y) in cav_seen if P(1, 1, 0, 8)[1] <= y < P(1, 1, 0, 13)[1] and 16 <= x < 32]
dmin = min(((x - sw[0]) ** 2 + (y - sw[1]) ** 2) ** 0.5 * 16 for (x, y) in near)
print("switch min distance px:", round(dmin, 1))

out = {
    "overworld": {"name": "Norway", "rows": ["".join(r) for r in ow], "ents": OW_ENT, "outdoor": True},
    "cavern": {"name": "Penguin Ice Cavern", "rows": ["".join(r) for r in cav], "ents": CAV_ENT, "dungeon": True},
    "home": {"name": "Owen's Room, New York", "rows": HOME, "ents": HOME_ENT, "interior": True},
    "arena": {"name": "Valhalla Arena", "rows": ARENA, "ents": [], "arena": True},
    "astrid_house": {"name": "Astrid's House", "rows": ASTRID, "ents": ASTRID_ENT, "interior": True},
    "bjarne_house": {"name": "Bjarne's House", "rows": BJARNE, "ents": BJARNE_ENT, "interior": True},
    "secret_cave": {"name": "Hidden Cave", "rows": CAVE, "ents": CAVE_ENT, "dark": True},
    "barrow": {"name": "The Drowned Barrow", "rows": ["".join(r) for r in br], "ents": BR_ENT, "dungeon": True},
    "redeye": {"name": "The Red-Eye", "rows": RE, "ents": RE_ENT, "dungeon": True, "dark": True, "redeye": True, "nokeys": True},
}
pathlib.Path("web/src/maps.js").write_text(
    "// Generated by tools/maps.py. Edit the ASCII there, then rerun it.\nconst MAPS = " + json.dumps(out, indent=0) + ";\n")
print("overworld", len(ow[0]), "x", len(ow), "| cavern", len(cav[0]), "x", len(cav), "| ok")
