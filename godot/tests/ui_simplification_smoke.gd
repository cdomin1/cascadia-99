extends SceneTree
const Main=preload("res://scripts/main.gd")
var main
var failed=false
func _initialize() -> void: call_deferred("run")
func wait_for(predicate: Callable, detail: String) -> void:
	var deadline=Time.get_ticks_msec()+12000
	while not predicate.call() and Time.get_ticks_msec()<deadline: await process_frame
	if not predicate.call(): failed=true;push_error(detail)
func capture(name: String) -> void:
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://../.web-smoke/ui/native-"+name+".png")
func run() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke/ui"))
	var cfg=ConfigFile.new();cfg.set_value("appearance","palette","tokyo");cfg.set_value("appearance","light",true);cfg.set_value("onboarding","choice","skip");cfg.set_value("network","server","http://127.0.0.1:3020");cfg.save("user://ui-simplification-qa.cfg")
	main=load("res://scenes/main.tscn").instantiate();main.settings_path="user://ui-simplification-qa.cfg";root.add_child(main)
	await wait_for(func(): return not main.network.player_id.is_empty(),"Initial connection")
	assert(not main.settings.has_section_key("appearance","palette"));assert(not main.settings.has_section_key("appearance","light"))
	await capture("title")
	main.show_mode_menu();await process_frame;main.focus_modal();assert(is_instance_valid(root.gui_get_focus_owner()));main.close_modal()
	main.start_offline("tutorial",1,{})
	await wait_for(func(): return main.screen_id=="arena" and main.training_status.get("lesson",-1)==1,"Offline lesson")
	await process_frame
	assert(not main.flux_group.visible and not main.hud_side.visible and not main.rival_scroll.visible)
	assert(main.tutorial_nav.visible and not main.tutorial_next.visible)
	await capture("tutorial")
	main.last_input="gamepad"
	var event=InputEventJoypadButton.new();event.button_index=JOY_BUTTON_A;event.pressed=true;main._input(event)
	await wait_for(func(): return main.training_status.get("done",false),"Actual clear")
	assert(main.tutorial_next.visible);assert(is_instance_valid(main.modal));main.close_modal();main.last_input="keyboard"
	for lesson in range(7):
		main.network.send_message({"type":"trainingControl","action":"lesson","lesson":lesson})
		await wait_for(func(): return main.training_status.get("lesson")==lesson,"Lesson state")
		assert(main.flux_group.visible==(lesson>=5))
		assert(main.rival_scroll.visible==(lesson==6))
	main.network.send_message({"type":"trainingStart","mode":"practice","options":{"rise":"off"}})
	await wait_for(func(): return main.training_status.get("mode")=="practice","Practice")
	assert(not main.tutorial_nav.visible and main.flux_group.visible and not main.rival_scroll.visible)
	await capture("practice")
	main.show_training_pause();await process_frame;main.focus_modal();assert(is_instance_valid(root.gui_get_focus_owner()));main.close_modal()
	main.network.send_message({"type":"leave"});await wait_for(func(): return main.screen_id=="title" and not main.network.player_id.is_empty(),"Return to online")
	await create_timer(.3).timeout
	for entry in [["duel",1],["quad",3],["teams",3],["battle",98]]:
		main.network.send_message({"type":"create","mode":entry[0],"bots":entry[1],"quick":true})
		await wait_for(func(): return main.screen_id=="arena" and main.snapshot.get("mode")==entry[0] and main.snapshot.get("countdown",1)==0,"Match "+entry[0])
		await capture(entry[0]);print("BOARD_BOUNDS ",main.own_board.get_global_rect()," WINDOW ",root.size)
		if main.own_board.get_global_rect().size.y<root.size.y*.65: push_error("Board not dominant");quit(1);return
		assert(main.incoming_label.visible==(main.snapshot.self.incoming.size()>0))
		await capture(entry[0])
		for dimensions in [Vector2(1920,1080),Vector2(2560,1440),Vector2(3440,1440),Vector2(1280,720),Vector2(800,620)]:
			main.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT);main.size=dimensions
			await process_frame;await process_frame
			assert(main.own_board.get_global_rect().size.y>=dimensions.y*.6)
		main.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		main.show_pause();await process_frame;main.focus_modal();assert(is_instance_valid(root.gui_get_focus_owner()));main.close_modal()
		main.network.send_message({"type":"leave"});await wait_for(func(): return main.screen_id=="title","Leave match")
	main.shutting_down=true;main.audio.shutdown();main.queue_free();await process_frame;await process_frame;await create_timer(.2).timeout
	if not failed: print("GODOT_UI_OK: canonical stale settings, title/mode focus, seven progressive lesson HUDs, real clear, practice pause, four modes/99 CPUs and board dominance")
	quit(1 if failed else 0)
