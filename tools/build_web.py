"""Assemble web/index.html from web/shell.html + web/src/*.js. Run: python3 tools/maps.py && python3 tools/build_web.py"""
import pathlib, sys
ORDER = ["maps.js", "story.js", "engine.js", "pixelfont.js", "music.js", "world.js", "actors.js", "art.js", "art2.js", "bigart.js", "redeye.js", "ch2.js", "jon.js", "snes.js", "awesome.js", "magic.js", "better.js", "giant.js", "owen.js", "sprites.js", "arena.js", "ui.js", "tech.js", "owenscript.js", "editor.js", "art3.js", "rock.js", "critters.js", "palace.js", "finish.js", "elf.js", "barrow.js", "main.js"]
root = pathlib.Path(__file__).resolve().parent.parent / "web"
score = (root.parent / "music" / "score.json").read_text()
js = "// ===== music/score.json =====\nconst SCORE = " + score + ";\n" + "\n".join(f"// ===== {n} =====\n" + (root / "src" / n).read_text() for n in ORDER)
page = (root / "shell.html").read_text().replace("/*SCRIPT*/", "'use strict';\n" + js)
# web/index.html is a whole document (doctype, viewport, home-screen icon): it is what Owen's link serves.
html = (root / "head.html").read_text() + page
(root / "index.html").write_text(html)
print("web/index.html", len(html), "bytes")
# The claude.ai artifact wraps the page in its own document, so it gets the page without head.html:
#   python3 tools/build_web.py --artifact /path/to/jontuka.html
if "--artifact" in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1])
    out.write_text(page)
    print(out, len(page), "bytes (artifact page, no document head)")
