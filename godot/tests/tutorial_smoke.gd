extends SceneTree
const Main = preload("res://scripts/main.gd")
const Gallery = preload("res://scripts/tutorial_gallery.gd")
var failures: Array = []
func check(condition: bool, detail: String) -> void:
	if not condition: failures.append(detail);push_error(detail)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var gallery=Gallery.new()
	gallery.position=Vector2(24,24);gallery.size=Vector2(480,500)
	root.add_child(gallery);gallery.set_process(false)
	for index in range(gallery.catalog.tutorials.size()):
		gallery.select_topic(index)
		check(gallery.atlas.atlas!=null,"Missing native tutorial atlas")
		var tutorial=gallery.catalog.tutorials[index]
		var atlas_image=gallery.atlas.atlas.get_image()
		var web_still=Image.load_from_file(ProjectSettings.globalize_path("res://../demo/tutorials/"+tutorial.id+".png"))
		atlas_image.convert(Image.FORMAT_RGBA8);web_still.convert(Image.FORMAT_RGBA8)
		var region=atlas_image.get_region(Rect2i(0,4*216,384,216))
		check(region.get_data()==web_still.get_data(),"Native/web still pixels differ: "+tutorial.id)
		check(gallery.atlas.region.position==Vector2.ZERO,"Topic did not restart")
		gallery._process(.2);check(gallery.atlas.region.position.x==768,"Native tutorial frames did not advance")
		gallery.reduced_effects=true;gallery.update_frame()
		check(gallery.atlas.region.position==Vector2(0,864) and gallery.pause.disabled,"Reduced effects must show still")
		gallery._process(.5);check(gallery.atlas.region.position==Vector2(0,864),"Reduced animation moved")
		gallery.reduced_effects=false;gallery.paused=true;gallery.update_frame()
		check(gallery.atlas.region.position==Vector2(0,864),"Pause must stop animated tutorial")
		gallery.paused=false
	await process_frame;await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	root.get_texture().get_image().save_png("res://../.web-smoke/godot-tutorials.png")
	gallery.queue_free();await process_frame
	var main=Main.new()
	main.size=Vector2(1280,800)
	root.add_child(main)
	main.show_help()
	check(main.modal.find_child("TutorialScroll",true,false) is ScrollContainer,"Native Help needs a scrolling body")
	check(main.modal.find_children("*","OptionButton",true,false).size()==1,"Native Help gallery is missing")
	await process_frame;await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://../.web-smoke/godot-help.png")
	main.shutting_down=true;main.audio.shutdown();main.queue_free();await process_frame
	if failures.is_empty(): print("GODOT_TUTORIAL_OK: ten clips, exact shared still pixels, playback, topic changes, pause, reduced effects")
	quit(0 if failures.is_empty() else 1)
