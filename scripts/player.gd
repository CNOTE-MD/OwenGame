extends Node2D
# Owen, the undead-voodoo narrator. Jon is his sword (Z) and his boomerang (X).

var g
var facing := Vector2.DOWN
var max_hp := 6
var hp := 6
var inv := 0.0
var cooldown := 0.0
var zombie := false
var speed := 72.0
var radius := 5.0
var kb := Vector2.ZERO
var walk := 0.0
var launching := false
var _lf := Vector2.ZERO
var _lt := Vector2.ZERO
var _lp := 0.0

func _ready() -> void:
	var t: Dictionary = g.tuning["player"]
	max_hp = int(t["hearts"]) * 2
	hp = max_hp
	speed = float(t["speed"])

func _process(delta: float) -> void:
	inv = max(0.0, inv - delta)
	cooldown = max(0.0, cooldown - delta)
	if g.state != "play":
		return
	if launching:
		_lp += delta / 0.6
		position = _lf.lerp(_lt, min(_lp, 1.0))
		if _lp >= 1.0:
			launching = false
		return
	var v := Input.get_vector("left", "right", "up", "down")
	if v != Vector2.ZERO:
		facing = v.normalized()
		walk += delta * 10.0
		g.try_move(self, v * speed * delta, radius)
	if kb.length() > 1.0:
		g.try_move(self, kb * delta, radius)
		kb = kb.move_toward(Vector2.ZERO, 500.0 * delta)
	if g.tile_at(position) == "~":
		g.dive(self)
		return
	if cooldown <= 0.0 and g.jon.mode == "follow":
		if Input.is_action_just_pressed("swing"):
			g.jon.swing(facing)
		elif Input.is_action_just_pressed("throw"):
			g.jon.throw(position, facing)

func damage_bonus() -> int:
	return int(g.tuning["player"]["zombie_bonus"]) if zombie else 0

func launch(to: Vector2) -> void:
	launching = true
	_lf = position
	_lt = to
	_lp = 0.0
	inv = 1.5
	if g.jon.mode != "follow":
		g.jon.mode = "follow"

func hurt(dmg: int, from_pos: Vector2) -> void:
	if inv > 0.0 or launching or g.state != "play":
		return
	hp -= dmg
	inv = 1.0
	kb = (position - from_pos).normalized() * 160.0
	if hp <= 0:
		hp = 0
		g.player_died()

func become_zombie() -> void:
	zombie = true
	hp = max_hp
	inv = 2.0

func _draw() -> void:
	var lift := 0.0
	if launching:
		lift = sin(PI * clamp(_lp, 0.0, 1.0)) * 28.0
	draw_rect(Rect2(-5, 5, 10, 2), Color(0, 0, 0, 0.3))
	if inv > 0.0 and int(inv * 20) % 2 == 0 and not launching:
		return
	var o := Vector2(0, -lift)
	var skin := Color(0.98, 0.78, 0.6)
	var tunic := Color(0.2, 0.5, 0.85)
	if zombie:
		skin = Color(0.55, 0.75, 0.5)
		tunic = Color(0.45, 0.25, 0.6)
	var step := int(walk) % 2
	draw_rect(Rect2(o + Vector2(-4, 3 + step), Vector2(3, 3)), Color(0.35, 0.22, 0.1))
	draw_rect(Rect2(o + Vector2(1, 3 + (1 - step)), Vector2(3, 3)), Color(0.35, 0.22, 0.1))
	draw_rect(Rect2(o + Vector2(-5, -3), Vector2(10, 7)), tunic)
	draw_rect(Rect2(o + Vector2(-5, 1), Vector2(10, 1)), Color(0.4, 0.25, 0.1))
	draw_rect(Rect2(o + Vector2(-4, -9), Vector2(8, 7)), skin)
	draw_rect(Rect2(o + Vector2(-5, -11), Vector2(10, 4)), Color(0.6, 0.6, 0.68))  # viking helmet
	draw_rect(Rect2(o + Vector2(-7, -13), Vector2(2, 4)), Color(0.95, 0.92, 0.8))
	draw_rect(Rect2(o + Vector2(5, -13), Vector2(2, 4)), Color(0.95, 0.92, 0.8))
	var back_view: bool = facing.y < -0.5 and abs(facing.x) < 0.3
	if not back_view:
		var ex: float = clamp(facing.x, -1.0, 1.0) if facing.y <= 0.5 else 0.0
		draw_rect(Rect2(o + Vector2(-3 + ex, -6), Vector2(1, 2)), Color(0.1, 0.1, 0.1))
		draw_rect(Rect2(o + Vector2(2 + ex, -6), Vector2(1, 2)), Color(0.1, 0.1, 0.1))
