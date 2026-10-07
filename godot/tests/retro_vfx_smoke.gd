extends SceneTree
const BoardView = preload("res://scripts/board_view.gd")
const Meter = preload("res://scripts/flux_meter.gd")
var failures: Array = []

func check(condition: bool, message: String) -> void:
	if not condition: failures.append(message);push_error(message)

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	root.content_scale_mode=Window.CONTENT_SCALE_MODE_DISABLED
	root.content_scale_size=Vector2i.ZERO
	root.size=Vector2i(440,800)
	root.title="VEXELON 99 — retro presentation QA"
	var view=BoardView.new()
	view.position=Vector2(40,40);view.size=Vector2(360,720)
	root.add_child(view);view.set_process(false)
	var meter=Meter.new()
	meter.position=Vector2(40,12);meter.size=Vector2(360,16);meter.show_percentage=false
	root.add_child(meter);meter.set_process(false)
	var grid: Array = []
	for y in range(12):
		var row: Array = []
		for x in range(6): row.append(1+(x+y)%4 if y>=9 else 0)
		grid.append(row)
	var slab={"id":1,"x":0,"y":7,"width":6,"height":2,"state":"idle"}
	var fixtures=JSON.parse_string(FileAccess.get_file_as_string("res://tests/retro-fixtures.json"))
	var directory=ProjectSettings.globalize_path("res://../.web-smoke")
	DirAccess.make_dir_recursive_absolute(directory)
	for fixture in fixtures:
		view.fx=BoardView.PresentationEffects.new();view.clock=0;view.effects=[];view.drops={};view.breaks={}
		view.reduce_motion=fixture.get("reduced",false);view.fx.reduced_motion=view.reduce_motion
		view.fx.flashing=fixture.get("flashing","full");view.fx.shake=fixture.get("shake","normal")
		var block=slab.duplicate();block.state=fixture.get("state","idle")
		var own={"grid":grid,"blocks":[block],"cursor":{"x":2,"y":10},"phase":"clear","matches":[54,55,56],"chain":fixture.get("chain",1),"score":0,"fallSerial":0}
		view.update_board(own,own)
		var kind=fixture.kind
		var event={"type":kind,"chain":fixture.get("chain",1),"count":fixture.get("count",3),"positions":[54,55,56],"blocks":[block]}
		if kind in ["pulse","shift","surge","overdrive"]:
			event.type="ability";event.ability=kind;view.add_effect(kind.to_upper()+"!")
		if kind=="effect": view.add_effect("CHAIN X"+str(int(event.chain)) if event.chain>1 else str(int(event.count))+" COMBO!")
		view.handle_event(event)
		if kind=="break": view.add_effect("BREAK!")
		meter.value=fixture.get("flux",75);meter.reduced_motion=view.reduce_motion;meter.flashing=view.fx.flashing
		meter._process(.032);view.fx.meter(meter.value,100)
		var age=float(fixture.get("age",.096))
		view.clock=age;view.fx.advance(age)
		view.active_ability=kind if kind in ["surge","overdrive"] else ""
		view.painter.queue_redraw();view.queue_redraw();meter.queue_redraw()
		await process_frame;await RenderingServer.frame_post_draw
		check(view.viewport.size==Vector2i(360,720),"Native internal board resolution changed")
		check(view.texture_filter==CanvasItem.TEXTURE_FILTER_NEAREST,"Native board filtering is not nearest")
		var offset=view.fx.offset()
		check(fmod(abs(offset.x),3)==0 and fmod(abs(offset.y),3)==0,"Unsnapped board offset: "+fixture.name)
		if view.reduce_motion or view.fx.shake=="off": check(offset==Vector2.ZERO,"Reduced/off setting shakes")
		var image=root.get_texture().get_image()
		check(not image.is_empty(),"Empty render: "+fixture.name)
		check(image.save_png(directory+"/retro-godot-"+fixture.name+".png")==OK,"Cannot save native fixture")
	# Animation state is distinct from authoritative snapshots.
	view.reduce_motion=false;view.clock=0
	view.handle_event({"type":"swap","x":1,"y":10,"left":1,"right":2})
	check(view.swap_animation.left==1 and view.swap_animation.right==2,"Swap animation dropped tile values")
	view.handle_event({"type":"garbage","blocks":[slab]})
	check(view.block_y(slab)==-2,"Garbage must begin above board")
	view.clock=.12;check(view.block_y(slab)>-2 and view.block_y(slab)<7,"Missing stepped garbage fall")
	view.clock=.24;check(view.block_y(slab)==7,"Garbage landing did not settle")
	view.fx.trigger("shift");check(view.fx.shift_offset()==-60,"Shift presentation must begin one row above final snapshot")
	view.fx.advance(.18);check(view.fx.shift_offset()==0,"Shift presentation did not settle")
	for size in [Vector2(300,600),Vector2(220,440),Vector2(360,720)]:
		view.size=size;view.queue_redraw();await process_frame;await RenderingServer.frame_post_draw
		check(view.viewport.size==Vector2i(360,720),"Responsive resize altered internal pixel grid")
	# Render cost only, not simulation/network/99-player scalability.
	view.size=Vector2(360,720);var timings: Array = []
	for frame in range(120):
		var started=Time.get_ticks_usec();view._process(1.0/60);await process_frame;await RenderingServer.frame_post_draw
		timings.append((Time.get_ticks_usec()-started)/1000.0)
	timings.sort()
	print("GODOT_RETRO_OK fixtures="+str(fixtures.size())+" frame-wall-p95-ms="+str(timings[113])+" (local single-board display)")
	view.queue_free();meter.queue_free();await process_frame
	quit(0 if failures.is_empty() else 1)
