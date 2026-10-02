extends Node2D
# Level, input, dialogue flow and win/lose states. Content comes from res://data/.

const T := 16
const PlayerS := preload("res://scripts/player.gd")
const JonS := preload("res://scripts/jon.gd")
const PenguinS := preload("res://scripts/penguin.gd")
const HudS := preload("res://scripts/hud.gd")

var tuning: Dictionary
var lines_db: Dictionary
var rows: PackedStringArray = []
var cols := 0
var nrows := 0
var player
var jon
var hud
var enemies: Array = []
var boss
var state := "play"   # play, talk, over, win
var spawn_pos := Vector2.ZERO
var launch_pos := Vector2.ZERO
var boss_seen := false
var dived_once := false
var _queue: Array = []
var _done: Callable = Callable()
var _t := 0.0

func _ready() -> void:
	_add_inputs()
	tuning = _load_json("res://data/tuning.json")
	lines_db = _load_json("res://data/dialogue.json")
	_load_level("res://data/level_lake.txt")
	_start()

func _start() -> void:
	for n in get_children():
		n.queue_free()
	enemies.clear()
	boss = null
	boss_seen = false
	dived_once = false
	var cam := Camera2D.new()
	player = PlayerS.new()
	player.g = self
	jon = JonS.new()
	jon.g = self
	hud = HudS.new()
	hud.g = self
	var layer := CanvasLayer.new()
	layer.add_child(hud)
	add_child(layer)
	for y in nrows:
		for x in cols:
			var c := rows[y][x]
			var p := Vector2(x * T + T / 2.0, y * T + T / 2.0)
			match c:
				"@": spawn_pos = p
				"L": launch_pos = p
				"p": _spawn_enemy(p, false)
				"B": _spawn_enemy(p, true)
	player.position = spawn_pos
	jon.position = spawn_pos + Vector2(10, -14)
	add_child(player)
	add_child(jon)
	player.add_child(cam)
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = cols * T
	cam.limit_bottom = nrows * T
	cam.make_current()
	state = "play"
	say(lines_db["intro"])

func _spawn_enemy(p: Vector2, is_boss: bool) -> void:
	var e = PenguinS.new()
	e.g = self
	e.position = p
	e.setup(is_boss)
	add_child(e)
	enemies.append(e)
	if is_boss:
		boss = e

func _load_json(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	var d = JSON.parse_string(f.get_as_text())
	return d if d is Dictionary else {}

func _load_level(path: String) -> void:
	var f := FileAccess.open(path, FileAccess.READ)
	rows = PackedStringArray()
	for line in f.get_as_text().split("\n"):
		if line.strip_edges() != "":
			rows.append(line)
	nrows = rows.size()
	cols = rows[0].length()

func tile_at(p: Vector2) -> String:
	var x := int(floor(p.x / T))
	var y := int(floor(p.y / T))
	if x < 0 or y < 0 or x >= cols or y >= nrows:
		return "T"
	return rows[y][x]

func is_solid(p: Vector2) -> bool:
	var c := tile_at(p)
	return c == "T" or c == "#"

func try_move(n: Node2D, motion: Vector2, r: float) -> void:
	var nx := n.position + Vector2(motion.x, 0)
	if not _blocked(nx, r):
		n.position = nx
	var ny := n.position + Vector2(0, motion.y)
	if not _blocked(ny, r):
		n.position = ny

func _blocked(p: Vector2, r: float) -> bool:
	return is_solid(p + Vector2(-r, -r)) or is_solid(p + Vector2(r, -r)) \
		or is_solid(p + Vector2(-r, r)) or is_solid(p + Vector2(r, r))

# --- dialogue ---
func say(lines: Array, done: Callable = Callable()) -> void:
	_queue = lines.duplicate()
	_done = done
	state = "talk"
	_next_line()

func _next_line() -> void:
	if _queue.is_empty():
		hud.talking = false
		state = "play"
		player.cooldown = 0.25
		var cb := _done
		_done = Callable()
		if cb.is_valid():
			cb.call()
		return
	var l: Array = _queue.pop_front()
	hud.show_line(l[0], l[1])

func skip_dialogue() -> void:
	while state == "talk":
		_next_line()

# --- events ---
func dive(who) -> void:
	who.launch(launch_pos)
	if not dived_once:
		dived_once = true
		say(lines_db["dive"])

func player_died() -> void:
	if not player.zombie:
		player.become_zombie()
		say(lines_db["revive"])
	else:
		state = "over"
		hud.banner = lines_db["game_over"]

func enemy_died(e) -> void:
	enemies.erase(e)
	if e == boss:
		state = "win"
		say(lines_db["win"], func():
			state = "win"
			hud.banner = lines_db["to_be_continued"] + "\nPress Z to restart")

func _process(delta: float) -> void:
	_t += delta
	queue_redraw()
	if state == "talk" and Input.is_action_just_pressed("confirm"):
		_next_line()
	elif (state == "over" or (state == "win" and hud.banner != "")) and Input.is_action_just_pressed("confirm"):
		_start()
	elif state == "play" and not boss_seen and boss != null and player.position.distance_to(boss.position) < 110:
		boss_seen = true
		boss.active = true
		say(lines_db["boss"])

# --- drawing ---
func _hash(x: int, y: int) -> int:
	return int(abs(sin(x * 12.9898 + y * 78.233) * 43758.5453)) % 100

func _draw() -> void:
	for y in nrows:
		for x in cols:
			var c := rows[y][x]
			var o := Vector2(x * T, y * T)
			var h := _hash(x, y)
			var ground := Color(0.33, 0.6, 0.24)
			if c == "s" or c == "L" or c == "B":
				ground = Color(0.86, 0.78, 0.5)
			elif c == "~":
				ground = Color(0.2, 0.4, 0.8)
			draw_rect(Rect2(o, Vector2(T, T)), ground)
			if ground.g > 0.55 and ground.r < 0.5 and h < 30:
				draw_rect(Rect2(o + Vector2(h % 12 + 1, (h * 7) % 12 + 1), Vector2(2, 3)), Color(0.25, 0.5, 0.18))
			elif ground.r > 0.8 and h < 20:
				draw_rect(Rect2(o + Vector2(h % 12 + 1, (h * 5) % 12 + 1), Vector2(2, 1)), Color(0.74, 0.66, 0.4))
			elif c == "~":
				var wv := int(_t * 2 + x + y) % 4
				if wv == 0:
					draw_rect(Rect2(o + Vector2(3, 5), Vector2(8, 1)), Color(0.45, 0.65, 0.95))
				elif wv == 2:
					draw_rect(Rect2(o + Vector2(5, 11), Vector2(7, 1)), Color(0.45, 0.65, 0.95))
			elif c == "T":
				draw_rect(Rect2(o, Vector2(T, T)), Color(0.08, 0.35, 0.15))
				draw_rect(Rect2(o + Vector2(2, 1), Vector2(12, 9)), Color(0.12, 0.5, 0.2))
				draw_rect(Rect2(o + Vector2(5, 3), Vector2(4, 3)), Color(0.2, 0.62, 0.28))
				draw_rect(Rect2(o + Vector2(6, 10), Vector2(4, 6)), Color(0.4, 0.26, 0.12))
			elif c == "#":
				draw_rect(Rect2(o + Vector2(1, 3), Vector2(14, 12)), Color(0.45, 0.45, 0.5))
				draw_rect(Rect2(o + Vector2(3, 3), Vector2(8, 3)), Color(0.65, 0.65, 0.7))
				draw_rect(Rect2(o + Vector2(1, 12), Vector2(14, 3)), Color(0.3, 0.3, 0.35))

func _add_inputs() -> void:
	var map := {
		"left": [KEY_LEFT, KEY_A], "right": [KEY_RIGHT, KEY_D],
		"up": [KEY_UP, KEY_W], "down": [KEY_DOWN, KEY_S],
		"swing": [KEY_Z, KEY_SPACE, KEY_J], "throw": [KEY_X, KEY_K, KEY_SHIFT],
		"confirm": [KEY_Z, KEY_SPACE, KEY_ENTER, KEY_J],
	}
	for action in map:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for k in map[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(action, ev)
