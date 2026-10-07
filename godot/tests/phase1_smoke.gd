extends SceneTree

const Main = preload("res://scripts/main.gd")
var game
var messages: Array = []
var failed = false

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, detail: String) -> bool:
	if not condition:
		failed=true
		push_error(detail)
		quit(1)
	return condition

func wait_message(kind: String, predicate: Callable = Callable()) -> Dictionary:
	var deadline=Time.get_ticks_msec()+12000
	while Time.get_ticks_msec()<deadline:
		for i in range(messages.size()):
			var message=messages[i]
			if message.get("type")==kind and (not predicate.is_valid() or predicate.call(message)):
				messages.remove_at(i)
				return message
		await process_frame
	check(false,"Phase 1 timeout: "+kind)
	return {}

func run() -> void:
	game=Main.new()
	game.settings_path="user://phase1-qa.cfg"
	root.add_child(game)
	game.network.received.connect(func(message): messages.append(message))
	await wait_message("hello")
	if failed: return
	if not check(game.flux_config.get("pulse",{}).get("cost")==35,"Native client did not receive shared config"): return
	for kind in ["pulse","shift","surge","overdrive"]:
		messages.clear()
		game.network.send_message({"type":"create","mode":"duel","bots":1,"quick":true})
		await wait_message("start")
		var state=await wait_message("state",func(s): return s.countdown==0 and (s.self.abilities.overdrive if kind=="overdrive" else true))
		if failed: return
		if not check(game.ability_buttons.size()==4 and game.flux_meter.max_value==100,"Missing native Flux controls"): return
		if not check(not game.ability_buttons[kind].disabled,"Native ability control is incorrectly disabled: "+kind): return
		game.ability_buttons[kind].pressed.emit()
		await wait_message("pulse" if kind=="pulse" else "ability")
		state=await wait_message("state",func(s): return s.self.flux==100-game.flux_config[kind].cost)
		if failed: return
		if not check(state.self.score==0,"An ability awarded native score"): return
		if kind=="pulse":
			if not check(state.self.incoming[0].amount==6,"Native Pulse did not cancel a row"): return
		elif kind=="shift":
			if not check(state.players.filter(func(p): return p.id==game.network.player_id)[0].grid[11].all(func(v): return v==0),"Native Shift did not remove bottom row"): return
		else:
			if not check(state.self.activeAbility==kind and state.self.abilityRemaining<=game.flux_config[kind].duration,"Native timer mismatch"): return
			if not check(not game.own_board.active_ability.is_empty() and game.ability_timer.text.contains(kind.to_upper()),"Native effect/countdown missing"): return
		if kind=="surge":
			var before=state
			messages.clear()
			game.network.socket.close()
			await wait_message("resumed")
			await wait_message("start",func(s): return s.get("resumed",false))
			state=await wait_message("state",func(s): return s.elapsed>before.elapsed+.4)
			if failed: return
			if not check(state.self.flux==25 and state.self.abilityRemaining<before.self.abilityRemaining,"Native reconnect reset Flux or timer"): return
		game.screen_shake="off";game.flashing_effects="reduced";game.reduced_motion=true;game.apply_theme()
		game.own_board.fx.reduced_motion=true
		game.own_board.fx.trigger("overdrive")
		if not check(game.own_board.fx.offset()==Vector2.ZERO and game.own_board.fx.offset(true)==Vector2.ZERO,"Native reduced-motion shake"): return
		game.network.send_message({"type":"leave"})
		await wait_message("left")
		if failed: return
	print("GODOT_PHASE1_OK: actual UI buttons, shared config, four costs, Shift, timers, Flux, effects settings, automatic session recovery")
	game.audio.shutdown()
	game.queue_free()
	await process_frame
	quit(0)
