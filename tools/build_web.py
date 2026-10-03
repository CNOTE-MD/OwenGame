"""Assemble web/index.html from web/shell.html + web/src/*.js. Run: python3 tools/maps.py && python3 tools/build_web.py"""
import pathlib
ORDER = ["maps.js", "story.js", "engine.js", "world.js", "actors.js", "sprites.js", "ui.js", "main.js"]
root = pathlib.Path(__file__).resolve().parent.parent / "web"
js = "\n".join(f"// ===== {n} =====\n" + (root / "src" / n).read_text() for n in ORDER)
html = (root / "shell.html").read_text().replace("/*SCRIPT*/", "'use strict';\n" + js)
(root / "index.html").write_text(html)
print("web/index.html", len(html), "bytes")
