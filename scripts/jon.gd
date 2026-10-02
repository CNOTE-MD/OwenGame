extends Node2D
# Jöntuka: flying, talking, singing Viking axe. Follows, swings (sword), or flies out and returns (boomerang).

var g
var mode := "follow"   # follow, swing, out, back
var vel := Vector2.ZERO
var travelled := 0.0
var hit_list: Array = []
var t := 0.0
var swing_t := 0.0
var swing_base := 0.0
var spin := 0.0
var quip := ""
var quip_t := 0.0
var next_quip := 6.0

func swing(dir: Vector2) -> void:
	mode = "swing"
	swing_t = 0.0
	swing_base = dir.angle()
	hit_list.clear()

func throw(from: Vector2, dir: Vector2) -> void:
	mode = "out"
	position = from
	vel = dir.normalized() * float(g.tuning["jon"]["throw_speed"])
	travelled = 0.0
	hit_list.clear()

func _process(delta: float) -> void:
	t += delta
	if g.state == "talk":
		return
	match mode:
		"follow":
			var target: Vector2 = g.player.position + Vector2(10, -14 + sin(t * 3.0) * 2.0)
			position = position.lerp(target, min(1.0, 8.0 * delta))
			spin = 0.0
		"swing":
			swing_t += delta
			var k: float = swing_t / 0.22
			var a: float = swing_base + lerp(-1.3, 1.3, k)
			position = g.player.position + Vector2.from_angle(a) * 15.0
			spin = a + PI / 2.0
			_hit_enemies(float(g.player.damage_bonus() + int(g.tuning["player"]["swing_damage"])), 10.0)
			if k >= 1.0:
				mode = "follow"
		"out":
			position += vel * delta
			travelled += vel.length() * delta
			spin += delta * 22.0
			_hit_enemies(float(int(g.tuning["jon"]["throw_damage"]) + g.player.damage_bonus()), 9.0)
			if travelled > float(g.tuning["jon"]["throw_range"]) or g.is_solid(position):
				mode = "back"
				hit_list.clear()
		"back":
			var to: Vector2 = g.player.position - position
			position += to.normalized() * 230.0 * delta
			spin += delta * 22.0
			_hit_enemies(float(int(g.tuning["jon"]["throw_damage"]) + g.player.damage_bonus()), 9.0)
			if to.length() < 8.0:
				mode = "follow"
	next_quip -= delta
	quip_t = max(0.0, quip_t - delta)
	if next_quip <= 0.0:
		next_quip = randf_range(9.0, 16.0)
		var q: Array = g.lines_db.get("quips", [])
		if not q.is_empty():
			quip = q[randi() % q.size()]
			quip_t = 2.5
	queue_redraw()

func _hit_enemies(dmg: float, reach: float) -> void:
	for e in g.enemies.duplicate():
		if e in hit_list or not e.active:
			continue
		if position.distance_to(e.position) < reach + e.radius:
			hit_list.append(e)
			e.hit(int(dmg), g.player.position if mode == "swing" else position)

func _draw() -> void:
	# Viking battle axe: long wooden handle, steel bearded head with a face, glowing blue (magic).
	draw_set_transform(Vector2.ZERO, spin, Vector2.ONE)
	var steel := Color(0.82, 0.88, 0.95)
	var edge := Color(0.95, 0.98, 1.0)
	var dark := Color(0.25, 0.35, 0.55)
	draw_rect(Rect2(-6, -9, 12, 18), Color(0.3, 0.6, 1.0, 0.18))   # magic glow
	draw_rect(Rect2(-1, -8, 2, 17), Color(0.5, 0.32, 0.14))         # handle
	draw_rect(Rect2(-1, -2, 2, 1), Color(0.3, 0.18, 0.08))          # grip wrap
	draw_rect(Rect2(-1, 2, 2, 1), Color(0.3, 0.18, 0.08))
	draw_rect(Rect2(-1, 8, 2, 2), Color(0.7, 0.7, 0.75))            # pommel
	# axe head: crescent blade on the right, small spike on the left
	draw_colored_polygon(PackedVector2Array([Vector2(1, -9), Vector2(10, -12), Vector2(12, -5), Vector2(10, 2), Vector2(1, -1)]), steel)
	draw_colored_polygon(PackedVector2Array([Vector2(10, -12), Vector2(12, -5), Vector2(10, 2), Vector2(9, -5)]), edge)
	draw_colored_polygon(PackedVector2Array([Vector2(-1, -8), Vector2(-4, -6), Vector2(-1, -4)]), steel)
	draw_polyline(PackedVector2Array([Vector2(1, -9), Vector2(10, -12), Vector2(12, -5), Vector2(10, 2), Vector2(1, -1), Vector2(1, -9)]), dark, 1.0)
	# face
	draw_rect(Rect2(3, -8, 3, 3), Color.WHITE)
	draw_rect(Rect2(7, -8, 3, 3), Color.WHITE)
	draw_rect(Rect2(4, -7, 1, 2), Color.BLACK)
	draw_rect(Rect2(8, -7, 1, 2), Color.BLACK)
	draw_rect(Rect2(4, -3, 5, 1), dark)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if quip_t > 0.0 and quip != "":
		var f := ThemeDB.fallback_font
		draw_string(f, Vector2(-30, -20), quip, HORIZONTAL_ALIGNMENT_CENTER, 60.0, 8, Color(1, 1, 0.7))
