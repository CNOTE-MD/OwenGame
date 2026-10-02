extends SceneTree
# Run: godot --headless --path . --script tests/smoke_test.gd

var fails := 0

func check(name: String, ok: bool) -> void:
	print(("PASS " if ok else "FAIL ") + name)
	if not ok:
		fails += 1

func frames(n: int) -> void:
	for i in n:
		await process_frame

func _initialize() -> void:
	var m = load("res://scenes/main.tscn").instantiate()
	root.add_child(m)
	await frames(3)
	check("intro dialogue starts", m.state == "talk")
	m.skip_dialogue()
	await frames(2)
	check("play after intro", m.state == "play")
	check("enemies spawned (5 penguins + boss)", m.enemies.size() == 6 and m.boss != null)
	var start_hp: int = m.player.hp

	# swing hits a nearby penguin
	var p = m.enemies[0]
	p.position = m.player.position + Vector2(14, 0)
	m.player.facing = Vector2.RIGHT
	m.player.cooldown = 0.0
	m.jon.swing(Vector2.RIGHT)
	await frames(20)
	check("swing damages penguin", p.hp < 2 or not is_instance_valid(p) or not m.enemies.has(p))

	# throw returns
	m.jon.mode = "follow"
	m.jon.throw(m.player.position, Vector2.UP)
	await create_timer(2.0).timeout
	check("jon returns after throw", m.jon.mode == "follow")

	# lake dive launches to shore
	m.player.position = Vector2(20 * 16 + 8, 12 * 16 + 8)
	await frames(5)
	check("dive starts", m.player.launching or m.state == "talk")
	m.skip_dialogue()
	await create_timer(1.0).timeout
	check("player lands at launch point", m.player.position.distance_to(m.launch_pos) < 2.0)

	# damage and zombie revive then game over
	m.player.inv = 0.0
	start_hp = m.player.hp
	m.player.hurt(1, m.player.position + Vector2(5, 0))
	check("hurt reduces hp", m.player.hp == start_hp - 1)
	m.player.inv = 0.0
	m.player.hurt(99, m.player.position)
	check("first death revives as zombie", m.player.zombie and m.player.hp == m.player.max_hp)
	m.skip_dialogue()
	await frames(2)
	m.player.inv = 0.0
	m.player.hurt(99, m.player.position)
	check("second death is game over", m.state == "over")

	# restart then beat the boss
	m._start()
	await frames(3)
	m.skip_dialogue()
	await frames(2)
	m.player.position = m.boss.position + Vector2(40, 0)
	await frames(3)
	check("boss wakes with dialogue", m.boss.active and m.state == "talk")
	m.skip_dialogue()
	m.boss.hit(99, m.player.position)
	await frames(3)
	check("boss death -> win dialogue", m.state == "talk" or m.state == "win")
	m.skip_dialogue()
	await frames(2)
	check("win banner shows", m.hud.banner.begins_with("TO BE CONTINUED"))

	print("FAILS: %d" % fails)
	quit(fails)
