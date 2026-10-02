extends Control
# Hearts, dialogue box and end banners.

var g
var talking := false
var banner := ""
var _speaker := Label.new()
var _body := Label.new()
var _who := ""
var _text := ""

const HEART := [" ## ## ", "#######", "#######", " ##### ", "  ###  ", "   #   "]

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	size = Vector2(256, 224)
	for l in [_speaker, _body]:
		l.add_theme_font_size_override("font_size", 10)
		add_child(l)
	_speaker.position = Vector2(16, 156)
	_speaker.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	_body.position = Vector2(16, 170)
	_body.size = Vector2(224, 40)
	_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_speaker.visible = false
	_body.visible = false

func show_line(who: String, text: String) -> void:
	talking = true
	_who = who
	_text = text
	_speaker.text = who
	_body.text = text
	_speaker.visible = true
	_body.visible = true

func _process(_delta: float) -> void:
	_speaker.visible = talking
	_body.visible = talking
	queue_redraw()

func _draw() -> void:
	if g == null or g.player == null:
		return
	for i in int(g.player.max_hp / 2.0):
		var full: int = clamp(g.player.hp - i * 2, 0, 2)
		for y in HEART.size():
			for x in 7:
				if HEART[y][x] == "#":
					var lit := full == 2 or (full == 1 and x < 4)
					var c := Color(0.95, 0.15, 0.2) if lit else Color(0.25, 0.1, 0.12)
					if g.player.zombie and lit:
						c = Color(0.6, 0.3, 0.85)
					draw_rect(Rect2(8 + i * 9 + x, 8 + y, 1, 1), c)
	if talking:
		draw_rect(Rect2(8, 150, 240, 66), Color.WHITE)
		draw_rect(Rect2(10, 152, 236, 62), Color(0.05, 0.05, 0.2))
		draw_string(ThemeDB.fallback_font, Vector2(228, 210), "v", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color.WHITE)
	if banner != "":
		draw_rect(Rect2(0, 80, 256, 56), Color(0, 0, 0, 0.75))
		var lines := banner.split("\n")
		for i in lines.size():
			draw_string(ThemeDB.fallback_font, Vector2(0, 104 + i * 16), lines[i], HORIZONTAL_ALIGNMENT_CENTER, 256, 10, Color.WHITE)
