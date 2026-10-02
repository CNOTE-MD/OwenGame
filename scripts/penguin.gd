extends Node2D
# Possessed penguins. The boss charges after a red wind-up.

var g
var is_boss := false
var hp := 2
var speed := 38.0
var charge_speed := 150.0
var touch := 1
var sight := 140.0
var active := true
var radius := 6.0
var flash := 0.0
var kb := Vector2.ZERO
var state := "chase"   # chase, wind, charge
var st := 0.0
var dir := Vector2.ZERO
var waddle := 0.0

func setup(boss: bool) -> void:
	is_boss = boss
	var d: Dictionary = g.tuning["boss"] if boss else g.tuning["penguin"]
	hp = int(d["hp"])
	speed = float(d["speed"])
	touch = int(d["touch_damage"])
	if boss:
		charge_speed = float(d["charge_speed"])
		radius = 11.0
		active = false   # wakes up when Owen gets close
	else:
		sight = float(d["sight"])

func hit(dmg: int, from_pos: Vector2) -> void:
	hp -= dmg
	flash = 0.15
	kb = (position - from_pos).normalized() * (80.0 if is_boss else 140.0)
	if hp <= 0:
		active = false
		g.enemy_died(self)
		queue_free()

func _process(delta: float) -> void:
	flash = max(0.0, flash - delta)
	queue_redraw()
	if g.state != "play" or not active:
		return
	waddle += delta * 8.0
	if kb.length() > 1.0:
		g.try_move(self, kb * delta, radius * 0.6)
		kb = kb.move_toward(Vector2.ZERO, 400.0 * delta)
	var to: Vector2 = g.player.position - position
	if is_boss:
		_boss_ai(delta, to)
	elif to.length() < sight:
		g.try_move(self, to.normalized() * speed * delta, radius * 0.6)
	if to.length() < radius + 4.0:
		g.player.hurt(touch, position)

func _boss_ai(delta: float, to: Vector2) -> void:
	st += delta
	match state:
		"chase":
			g.try_move(self, to.normalized() * speed * delta, radius * 0.6)
			if st > 2.2:
				state = "wind"
				st = 0.0
		"wind":
			dir = to.normalized()
			if st > 0.6:
				state = "charge"
				st = 0.0
		"charge":
			var before := position
			g.try_move(self, dir * charge_speed * delta, radius * 0.6)
			if st > 0.7 or before.distance_to(position) < 0.1:
				state = "chase"
				st = 0.0

func _draw() -> void:
	var s := 2.0 if is_boss else 1.0
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(s, s))
	draw_rect(Rect2(-6, 5, 12, 2), Color(0, 0, 0, 0.3))
	var sway := sin(waddle) * 1.0
	var body := Color(0.1, 0.1, 0.22)
	if flash > 0.0:
		body = Color.WHITE
	elif is_boss and state == "wind":
		body = Color(0.55, 0.1, 0.1)
	draw_rect(Rect2(-5 + sway, -6, 10, 12), body)
	draw_rect(Rect2(-3 + sway, -2, 6, 7), Color(0.95, 0.95, 1.0))
	draw_rect(Rect2(-4 + sway, -5, 8, 3), body)
	draw_rect(Rect2(-1 + sway, -3, 3, 2), Color(1.0, 0.65, 0.1))
	draw_rect(Rect2(-3, 6, 2, 1), Color(1.0, 0.65, 0.1))
	draw_rect(Rect2(1, 6, 2, 1), Color(1.0, 0.65, 0.1))
	var eye := Color(1, 0.1, 0.1)   # possessed
	draw_rect(Rect2(-3 + sway, -5, 2, 2), eye)
	draw_rect(Rect2(1 + sway, -5, 2, 2), eye)
