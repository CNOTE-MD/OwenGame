"""Export music/score.json to standard MIDI files (music/midi/*.mid), one per track.
General MIDI instruments, drums on channel 10, time-signature changes per section.
Open them in GarageBand/Logic, or import into Unity later. Run: python3 tools/music_to_midi.py"""
import json, pathlib, struct, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from score import midi_of

TPQ = 480; STEP = TPQ // 2   # one step = an eighth note
# channel, GM program (0-based), velocity
INST = {"bass": (0, 33, 100), "gtr": (1, 30, 88), "lead": (2, 81, 92), "pad": (3, 88, 70),
        "pluck": (4, 24, 80), "bell": (5, 9, 85), "flute": (6, 73, 80), "piano": (7, 0, 92), "choir": (8, 52, 72)}
DRUM = {"k": 36, "s": 38, "h": 42, "o": 46, "c": 49, "r": 37}
TOM = {"h": 50, "m": 47, "l": 45}

def vlq(n):
    out = [n & 0x7F]; n >>= 7
    while n: out.append((n & 0x7F) | 0x80); n >>= 7
    return bytes(reversed(out))

def track_chunk(events):
    events.sort(key=lambda e: (e[0], e[1]))
    data, last = b"", 0
    for t, _, msg in events:
        data += vlq(t - last) + msg; last = t
    data += vlq(0) + b"\xff\x2f\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data

def export(tid, tr):
    tempo = int(60_000_000 / tr["bpm"])
    conductor = [(0, 0, b"\xff\x51\x03" + tempo.to_bytes(3, "big")), (0, 0, b"\xff\x03" + bytes([len(tr["name"])]) + tr["name"].encode())]
    per = {k: [] for k in list(INST) + ["drums"]}
    t0 = 0
    for sid in tr["order"]:
        sec = tr["sections"][sid]; n = sec["steps"]
        num, den = (n // 2, 4) if n % 2 == 0 else (n, 8)
        conductor.append((t0, 0, b"\xff\x58\x04" + bytes([num, {4: 2, 8: 3}[den], 24, 8])))
        bars = None
        for line, text in sec.items():
            if line == "steps": continue
            if line in INST:
                ch, _, vel = INST[line]
                toks = [t for bar in text.split("|") for t in bar.split()]
                bars = len(toks) // n
                for i, tok in enumerate(toks):
                    if tok in "-.": continue
                    hold = 1
                    while i + hold < len(toks) and toks[i + hold] == "-": hold += 1
                    for nt in tok.split("+"):
                        m = midi_of(nt); on = t0 + i * STEP; off = on + hold * STEP - 10
                        per[line] += [(on, 1, bytes([0x90 | ch, m, vel])), (off, 0, bytes([0x80 | ch, m, 0]))]
            else:
                chars = "".join(text.split("|")).replace(" ", "")
                bars = len(chars) // n
                for i, c in enumerate(chars):
                    if c == ".": continue
                    note = TOM[c] if line == "t" else DRUM[line]
                    vel = 120 if c == "X" else 70 if line in ("h", "r") else 100
                    on = t0 + i * STEP
                    per["drums"] += [(on, 1, bytes([0x99, note, vel])), (on + 60, 0, bytes([0x89, note, 0]))]
        t0 += (bars or 4) * n * STEP
    chunks = [track_chunk(conductor)]
    for name, evs in per.items():
        if not evs: continue
        head = [(0, 0, b"\xff\x03" + bytes([len(name)]) + name.encode())]
        if name in INST: head.append((0, 0, bytes([0xC0 | INST[name][0], INST[name][1]])))
        chunks.append(track_chunk(head + evs))
    return b"MThd" + struct.pack(">IHHH", 6, 1, len(chunks), TPQ) + b"".join(chunks)

if __name__ == "__main__":
    root = pathlib.Path(__file__).resolve().parent.parent
    score = json.loads((root / "music" / "score.json").read_text())
    (root / "music" / "midi").mkdir(parents=True, exist_ok=True)
    for tid, tr in score.items():
        p = root / "music" / "midi" / f"{tid}.mid"
        p.write_bytes(export(tid, tr))
        print(p.relative_to(root), p.stat().st_size, "bytes")
