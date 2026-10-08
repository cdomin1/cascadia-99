extends SceneTree
const Main=preload("res://scripts/main.gd")
var main
func _initialize() -> void: call_deferred("run")
func run() -> void:
	main=Main.new();root.add_child(main);main.set_process(false);main.close_modal()
	main.start_offline("tutorial",1,{})
	var deadline=Time.get_ticks_msec()+10000
	while main.screen_id!="arena" or main.training_status.get("lesson",-1)!=1:
		if Time.get_ticks_msec()>deadline: push_error("Offline native start timeout");quit(1);return
		await process_frame
	assert(main.training_mode)
	var event=InputEventKey.new();event.physical_keycode=KEY_SPACE;event.pressed=true
	main._input(event)
	deadline=Time.get_ticks_msec()+5000
	while not main.training_status.get("done",false):
		if Time.get_ticks_msec()>deadline: push_error("Real native offline clear timeout");quit(1);return
		await process_frame
	main.network.send_message({"type":"trainingStart","mode":"practice","options":{"flux":"unlimited","rise":"off","gameOver":false}})
	deadline=Time.get_ticks_msec()+5000
	while main.training_status.get("mode")!="practice" or main.snapshot.get("self",{}).get("flux",0)!=100:
		if Time.get_ticks_msec()>deadline: push_error("Practice timeout");quit(1);return
		await process_frame
	main.show_training_pause();await process_frame
	assert(is_instance_valid(main.modal))
	main.close_modal()
	print("GODOT_OFFLINE_TRAINING_OK: local bridge, real swap/clear, practice unlimited Flux and pause UI")
	main.shutting_down=true
	main.audio.shutdown()
	main.queue_free()
	await process_frame
	await process_frame
	await create_timer(.2).timeout
	quit(0)
