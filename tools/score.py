"""The game's music, written as step sequences. Original compositions in the style of Rush:
odd meters, a melodic bass that does more than hold roots, power chords, synth leads, tom fills.

Each step is an eighth note. In a line, a token is a note (E2), a chord (E3+B3), '-' to hold
the previous note, or '.' for silence. Bars are separated by '|'. Drum lines use one character
per step: x hit, X accent, . nothing (toms use h/m/l for high/mid/low).
Run: python3 tools/score.py  -> writes music/score.json (used by the game) and checks every bar.
"""
import json, pathlib, sys

def rep(s, n): return "|".join([s] * n)

TRACKS = {
  "title": {"name": "Overture of the Axe", "bpm": 92, "gain": 0.9, "order": ["A", "B"], "sections": {
    "A": {"steps": 8,
      "pad":  "E3+G3+B3 - - - - - - - | C3+E3+G3 - - - - - - - | G3+B3+D4 - - - - - - - | D3+F#3+A3 - - - - - - -",
      "bass": "E2 - - - - - E2 - | C2 - - - - - C2 - | G1 - - - - - G1 - | D2 - - - - - D2 -",
      "lead": "E4 - - - - - B4 - | C5 - - - - - G4 - | B4 - - - A4 - G4 - | F#4 - - - - - - -",
      "k": "x.......|x.......|x.......|x.......", "c": "x.......|x.......|x.......|x.......",
      "t": "........|........|........|hhmmllll"},
    "B": {"steps": 8,
      "pad":  "E3+G3+B3 - - - - - - - | C3+E3+G3 - - - - - - - | G3+B3+D4 - - - - - - - | D3+F#3+A3 - - - - - - -",
      "bass": "E2 E2 B2 E2 E3 E2 D3 B2 | C2 C2 G2 C2 C3 C2 B2 G2 | G1 G1 D2 G1 G2 G1 F#2 D2 | D2 D2 A2 D2 D3 D2 C#3 A2",
      "lead": "G4 - B4 - E5 - - - | E5 - D5 - C5 - G4 - | D5 - - - B4 - G4 - | A4 - - - - - - -",
      "k": "x..x..x.|x..x..x.|x..x..x.|x..x.xxx", "s": "....x...|....x...|....x...|....x.xx",
      "h": "x.x.x.x.|x.x.x.x.|x.x.x.x.|x.x.x...", "c": "x.......|........|x.......|........"},
  }},
  "overworld": {"name": "Fjords in Seven", "bpm": 150, "gain": 0.85, "order": ["A", "A", "B", "B"], "sections": {
    "A": {"steps": 7,
      "bass": "E2 E3 B2 E2 D3 E2 B2 | E2 E3 B2 E2 G2 A2 B2 | C2 C3 G2 C2 B2 C3 G2 | D2 D3 A2 D2 F#2 A2 D3",
      "gtr":  "E3+B3 . E3+B3 . E3+B3 - - | E3+B3 . E3+B3 . G3+D4 - - | C3+G3 . C3+G3 . C3+G3 - - | D3+A3 . D3+A3 . D3+A3 - -",
      "lead": "B4 - - A4 G4 - E4 | G4 - A4 B4 - D5 - | E5 - - D5 C5 - G4 | A4 - B4 - F#4 - -",
      "k": "x...x..|x...x..|x...x..|x...x.x", "s": "..x...x|..x...x|..x...x|..x..xx",
      "h": rep("xxxxxxx", 4), "c": "x......|.......|.......|......."},
    "B": {"steps": 8,
      "bass": "G2 G2 G3 G2 D3 G2 F#2 G2 | D2 D2 D3 D2 A2 D2 F#2 A2 | E2 E2 E3 E2 B2 E2 D3 B2 | C2 C2 C3 C2 G2 C2 D2 D2",
      "gtr":  "G3+D4 - . G3+D4 - . G3+D4 . | D3+A3 - . D3+A3 - . D3+A3 . | E3+B3 - . E3+B3 - . E3+B3 . | C3+G3 - . C3+G3 - . D3+A3 -",
      "lead": "D5 - - B4 - G4 - - | A4 - - F#4 - D4 - - | E4 - G4 - B4 - E5 - | E5 - D5 - C5 - B4 -",
      "k": "x..xx...|x..xx...|x..xx...|x..xx.xx", "s": "..x...x.|..x...x.|..x...x.|..x.....",
      "h": rep("x.x.x.x.", 4), "c": "x.......|........|x.......|........", "t": "........|........|........|....hhml"},
  }},
  "village": {"name": "Fjordvik Morning", "bpm": 112, "gain": 0.75, "order": ["A", "B"], "sections": {
    "A": {"steps": 8,
      "pluck": "G3 B3 D4 G4 D4 B3 G3 B3 | E3 G3 B3 E4 B3 G3 E3 G3 | C3 E3 G3 C4 G3 E3 C3 E3 | D3 F#3 A3 D4 A3 F#3 D3 F#3",
      "bass":  "G2 - - - G2 - D2 - | E2 - - - E2 - B1 - | C2 - - - C2 - G1 - | D2 - - - D2 - A1 -",
      "flute": "B4 - - - A4 - G4 - | E4 - - - G4 - - - | C5 - B4 - A4 - G4 - | A4 - - - - - - -",
      "k": rep("x...x...", 4), "r": rep("..x...x.", 4), "h": rep("x.x.x.x.", 4)},
    "B": {"steps": 8,
      "pluck": "G3 B3 D4 G4 D4 B3 G3 B3 | E3 G3 B3 E4 B3 G3 E3 G3 | C3 E3 G3 C4 G3 E3 C3 E3 | D3 F#3 A3 D4 A3 F#3 D3 F#3",
      "bass":  "G2 - - - G2 - D2 - | E2 - - - E2 - B1 - | C2 - - - C2 - G1 - | D2 - - - D2 - A1 -",
      "flute": "D5 - - - B4 - G4 - | E5 - - - D5 - B4 - | C5 - E5 - D5 - C5 - | B4 - - - A4 - - -",
      "k": rep("x...x...", 4), "r": rep("..x...x.", 4), "h": rep("xxxxxxxx", 4)},
  }},
  "dungeon": {"name": "Ice Cavern in Five", "bpm": 104, "gain": 0.9, "order": ["A", "A"], "sections": {
    "A": {"steps": 10,
      "bass": "A1 . A2 A1 . E2 . G2 F2 E2 | A1 . A2 A1 . E2 . C3 B2 G2 | F1 . F2 F1 . C2 . E2 D2 C2 | E1 . E2 E1 . B1 . E2 F2 G#2",
      "pad":  "A3+C4+E4 - - - - - - - - - | A3+C4+E4 - - - - - - - - - | F3+A3+C4 - - - - - - - - - | E3+G#3+B3 - - - - - - - - -",
      "bell": "E5 - - - - . . . . . | . . . . . D5 - - C5 - | A4 - - - - . . . . . | . . . . . B4 - - G#4 -",
      "k": rep("x....x....", 4), "s": "...x....x.|...x....x.|...x....x.|...x...xxx",
      "h": rep(".x.x.x.x.x", 4)},
  }},
  "boss": {"name": "Penguin King (Ak Ak Ak)", "bpm": 168, "gain": 0.85, "order": ["A", "A", "B"], "sections": {
    "A": {"steps": 7,
      "bass": "E2 E2 E2 G2 E2 A2 A#2 | E2 E2 E2 G2 E2 A#2 A2 | C2 C2 C2 D#2 C2 F2 F#2 | D2 D2 D2 F2 D2 G2 G#2",
      "gtr":  "E3+B3 E3+B3 E3+B3 G3+D4 E3+B3 A3+E4 A#3+F4 | E3+B3 E3+B3 E3+B3 G3+D4 E3+B3 A#3+F4 A3+E4 | C3+G3 C3+G3 C3+G3 D#3+A#3 C3+G3 F3+C4 F#3+C#4 | D3+A3 D3+A3 D3+A3 F3+C4 D3+A3 G3+D4 G#3+D#4",
      "lead": ". . . . . . . | B4 - A#4 - A4 G4 E4 | . . . . . . . | D5 - C#5 - C5 A#4 G#4",
      "k": "xx.xx..|xx.xx..|xx.xx..|xx.xx.x", "s": "..x..x.|..x..x.|..x..x.|..x..xx",
      "h": rep("xxxxxxx", 4), "c": "x......|.......|x......|......."},
    "B": {"steps": 8,
      "bass": "E2 - - - G2 - A2 A#2 | B2 - - - D3 - C3 B2 | E2 - - - G2 - A2 A#2 | B2 - A2 - G2 - F#2 -",
      "gtr":  "E3+B3 - - - G3+D4 - A3+E4 A#3+F4 | B3+F#4 - - - D4+A4 - C4+G4 B3+F#4 | E3+B3 - - - G3+D4 - A3+E4 A#3+F4 | B3+F#4 - A3+E4 - G3+D4 - F#3+C#4 -",
      "lead": "E5 - - - G5 - F#5 E5 | D#5 - - - - - - - | E5 - - - G5 - A5 A#5 | B5 - A5 - G5 - F#5 -",
      "k": "x...x...|x...x...|x...x...|x.x.x.xx", "s": "....x...|....x...|....x...|..x.x.xx",
      "h": rep("x.x.x.x.", 4), "c": "x.......|........|x.......|........", "t": "........|........|........|hmlhmlll"},
  }},
  "arena": {"name": "Valhalla in Thirteen", "bpm": 156, "gain": 0.85, "order": ["A", "A", "B", "B"], "sections": {
    "A": {"steps": 13,
      "bass": "A2 A2 E3 A2 G2 A2 C3 A2 A2 E3 A2 D3 C3 | F2 F2 C3 F2 E2 F2 A2 G2 G2 D3 G2 B2 D3",
      "gtr":  "A3+E4 . A3+E4 . A3+E4 - - A3+E4 . A3+E4 . D4+A4 - | F3+C4 . F3+C4 . F3+C4 - - G3+D4 . G3+D4 . G3+D4 -",
      "lead": "A4 - C5 - E5 - D5 C5 - B4 - A4 - | F5 - E5 - C5 - A4 G4 - B4 - D5 -",
      "k": "x...x..x..x..|x...x..x..x..", "s": "..x..x...x..x|..x..x...x.xx",
      "h": rep("xxxxxxxxxxxxx", 2), "c": "x............|............."},
    "B": {"steps": 13,
      "bass": "A2 A2 E3 A2 G2 A2 C3 A2 A2 E3 A2 D3 C3 | F2 F2 C3 F2 E2 F2 A2 G2 G2 D3 G2 B2 D3",
      "gtr":  "A3+E4 . A3+E4 . A3+E4 - - A3+E4 . A3+E4 . D4+A4 - | F3+C4 . F3+C4 . F3+C4 - - G3+D4 . G3+D4 . G3+D4 -",
      "lead": "E5 - - D5 C5 - E5 D5 - - B4 - G4 | A5 - - G5 F5 - E5 D5 - E5 - G5 -",
      "k": "x...x..x..x..|x...x..x..x..", "s": "..x..x...x..x|..x..x...xxxx",
      "h": rep("xxxxxxxxxxxxx", 2), "c": "x............|x............", "t": ".............|.........hhml"},
  }},
  "bjarne": {"name": "Rush Ø (Bjarne's Masterpiece)", "bpm": 200, "gain": 0.8, "order": ["A", "A", "B"], "sections": {
    "A": {"steps": 8,
      "pluck": "E4 G4 B4 E5 B4 G4 E4 G4 | F#4 A4 C5 F#5 C5 A4 F#4 A4 | G4 B4 D5 G5 D5 B4 G4 B4 | A4 C5 E5 A5 G5 F#5 E5 D#5",
      "bass":  "E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | A2 A3 B2 B3 B2 B3 B2 B3",
      "k": rep("x.x.x.x.", 4), "s": "..x...x.|..x...x.|..x...x.|..x.xxxx", "h": rep("xxxxxxxx", 4)},
    "B": {"steps": 8,
      "pluck": "E5 D#5 E5 B4 G4 B4 E5 G5 | F#5 E5 D#5 E5 B4 G4 F#4 G4 | E5 G5 B5 G5 E5 B4 G4 E4 | B4 A#4 B4 C5 B4 A4 G4 F#4",
      "lead":  "B5 - - - - - - - | A5 - - - - - - - | G5 - - - E6 - - - | D#6 - - - B5 - - -",
      "bass":  "E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | A1 A2 A1 A2 A1 A2 A1 A2 | B1 B2 B1 B2 B1 B2 B1 B2",
      "k": rep("x.x.x.x.", 4), "s": rep("..x...x.", 4), "h": rep("xxxxxxxx", 4), "c": "x.......|........|x.......|........"},
  }},
  "creepy": {"name": "Flight 364", "bpm": 60, "gain": 1.8, "order": ["A"], "sections": {
    "A": {"steps": 8,
      "pad":  rep("A2+D#3 - - - - - - -", 4),
      "bell": ". . . . A#5 - - - | . . A5 - . . . . | . . . . . . . . | D#6 - . . . . E5 -",
      "k": rep("x..x....", 4)},
  }},
}

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
def midi_of(tok):
    name, acc, octv = tok[0], tok[1] if tok[1] in "#b" else "", tok[2:] if tok[1] in "#b" else tok[1:]
    return (int(octv) + 1) * 12 + NOTE[name] + (1 if acc == "#" else -1 if acc == "b" else 0)

def check():
    errors = []
    for tid, tr in TRACKS.items():
        for sid, sec in tr["sections"].items():
            n = sec["steps"]
            bars = None
            for line, text in sec.items():
                if line == "steps": continue
                parts = text.split("|")
                bars = bars or len(parts)
                if len(parts) != bars: errors.append(f"{tid}.{sid}.{line}: {len(parts)} bars, expected {bars}")
                for i, bar in enumerate(parts):
                    count = len(bar.split()) if line in ("bass", "gtr", "lead", "pad", "pluck", "bell", "flute") else len(bar.strip())
                    if count != n: errors.append(f"{tid}.{sid}.{line} bar {i + 1}: {count} steps, expected {n}")
                    if line in ("bass", "gtr", "lead", "pad", "pluck", "bell", "flute"):
                        for tok in bar.split():
                            if tok in "-.": continue
                            for nt in tok.split("+"): midi_of(nt)
    return errors

if __name__ == "__main__":
    errs = check()
    if errs:
        print("\n".join(errs)); sys.exit(1)
    out = pathlib.Path(__file__).resolve().parent.parent / "music" / "score.json"
    out.write_text(json.dumps(TRACKS, indent=1))
    print("music/score.json:", ", ".join(f"{k} ({v['name']})" for k, v in TRACKS.items()))
