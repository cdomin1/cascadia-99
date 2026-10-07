extends SceneTree
var main
var failed = false
var sent: Dictionary = {}
var incoming: Dictionary = {}
func _initialize() -> void: call_deferred("run")
func check(value: bool, detail: String) -> void:
	if not value: failed=true;push_error(detail)
func wait_for(predicate: Callable, detail: String) -> void:
	var until=Time.get_ticks_msec()+12000
	while not predicate.call() and Time.get_ticks_msec()<until: await process_frame
	check(predicate.call(),"Timed out: "+detail)
func run() -> void:
	var cfg=ConfigFile.new();cfg.set_value("audio","music",false);cfg.set_value("audio","sound",false);cfg.save("user://targeting-qa.cfg")
	main=load("res://scenes/main.tscn").instantiate();main.settings_path="user://targeting-qa.cfg";root.add_child(main)
	main.network.received.connect(func(message):
		if message.type=="sent": sent=message
		if message.type=="attack": incoming=message)
	await wait_for(func(): return not main.network.player_id.is_empty(),"connection")
	for bots in [1,98]:
		sent={};incoming={}
		main.network.send_message({"type":"create","mode":"battle","bots":bots,"quick":true})
		await wait_for(func(): return not sent.is_empty(),"confirmed outgoing attack")
		if failed: break
		check(sent.sourceId==main.network.player_id,"Wrong source board")
		await wait_for(func(): return main.rival_views.has(sent.targetId),"destination thumbnail")
		check(main.battle_targeting.last_sequence>0,"Native layer ignored authoritative event")
		check(main.rival_views[sent.targetId].player_number>0,"Missing player number")
		if bots==1:
			await wait_for(func(): return not incoming.is_empty(),"incoming attack")
			check(incoming.targetId==main.network.player_id,"Wrong incoming destination")
		else:
			check(main.rival_views.size()==98,"Missing 99-seat thumbnails")
			main.network.send_message({"type":"target","id":sent.targetId})
			await wait_for(func(): return main.snapshot.self.get("attackTarget")==sent.targetId,"target highlight")
			check(main.rival_views[sent.targetId].targeted,"Target not highlighted")
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://../.web-smoke/targeting-99.png")
		main.reduced_motion=true;main.flashing_effects="reduced";main.apply_theme()
		main.network.send_message({"type":"leave"})
		await wait_for(func(): return main.screen_id=="title","leave")
	main.audio.shutdown();main.queue_free();await process_frame
	print("GODOT_TARGETING_FLOW_OK: live server source/destination, incoming indicator, target highlight and 99-seat CPU layout")
	quit(1 if failed else 0)
