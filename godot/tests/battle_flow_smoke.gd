extends SceneTree
var main
var failed = false
var address = "http://127.0.0.1:3003"
func _initialize() -> void:
	call_deferred("run")
func check(value: bool, text: String) -> void:
	if not value: failed=true;push_error(text)
func wait_for(predicate: Callable, text: String, seconds: float = 8) -> void:
	var deadline=Time.get_ticks_msec()+seconds*1000
	while not predicate.call() and Time.get_ticks_msec()<deadline: await process_frame
	check(predicate.call(),"Timed out: "+text)
func run() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	var cfg=ConfigFile.new()
	cfg.set_value("audio","music_volume",.3);cfg.set_value("audio","sfx_volume",.3)
	cfg.save("user://intro-test-settings.cfg")
	main=load("res://scenes/main.tscn").instantiate()
	main.settings_path="user://intro-test-settings.cfg"
	root.add_child(main)
	await wait_for(func(): return not main.network.player_id.is_empty(),"connection")
	if failed: quit(1);return
	var music=root.get_node("MusicManager")
	var initial_starts=music.starts
	for index in range(3):
		main.reduced_motion=index==1;main.flashing_effects="reduced" if index==1 else "full";main.screen_shake="off" if index==1 else "normal"
		main.apply_theme()
		main.network.send_message({"type":"create","mode":"duel" if index==0 else ("quad" if index==1 else "teams"),"bots":1 if index==0 else 3,"quick":true})
		await wait_for(func(): return is_instance_valid(main.battle_intro) and main.battle_intro.start_at>0,"scheduled intro")
		if failed: break
		var intro=main.battle_intro
		check(intro.start_at-intro.countdown_at==3000,"Countdown is not three seconds")
		for text in ["3","2","1","GO!"]:
			await wait_for(func(): return intro.current_label==text,"countdown "+text,5)
			check(intro.can_play()==(text=="GO!"),"Input gate does not match GO")
			if index==0:
				await RenderingServer.frame_post_draw
				root.get_texture().get_image().save_png("res://../.web-smoke/battle-flow-"+text.replace("!","")+".png")
		check(music.starts==initial_starts,"Menu-to-battle restarted music")
		check(music.primary_players==1,"Multiple primary music players")
		await wait_for(func(): return main.snapshot.get("countdown",1)==0,"active state")
		main.network.send_message({"type":"leave"})
		await wait_for(func(): return main.screen_id=="title","return to menu")
		check(music.starts==initial_starts,"Return to menu restarted music")
	# Reload the main scene while the autoload retains its player and phrase position.
	var saved_step=music.step
	main.queue_free();await process_frame
	main=load("res://scenes/main.tscn").instantiate();main.settings_path="user://intro-test-settings.cfg";root.add_child(main)
	await process_frame
	check(music.starts==initial_starts and music.step>=saved_step,"Scene reload reset the music")
	main.network.send_message({"type":"leave"});music.shutdown();main.queue_free();await process_frame
	print("GODOT_BATTLE_FLOW_OK: three consecutive mode starts, full countdown, GO gate, reduced effects, persistent music and scene reload")
	quit(1 if failed else 0)
