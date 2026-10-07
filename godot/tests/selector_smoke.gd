extends SceneTree
const Board = preload("res://scripts/board_view.gd")
var board
var fixtures: Array = []
var current: Dictionary = {}
func _initialize() -> void: call_deferred("run")
func paint(view: Control) -> void:
	var shades=[Color("#FF6B97"),Color("#38FFFF"),Color("#66FF1A"),Color("#FFB81C"),Color("#334155"),Color.WHITE]
	for row in range(12):
		for col in range(6): view.draw_rect(Rect2(col*60,row*60,60,60),shades[(col+row)%6])
	board.paint_selector(view)
func run() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	board=Board.new();board.size=Vector2(360,720);root.add_child(board);board.set_process(false)
	for x in [0,2,4]:
		for y in [0,7,11]:
			for variant in range(4): fixtures.append({"id":str(fixtures.size()),"x":x,"y":y,"rise":.75 if variant==3 else 0.0,"time":.5 if variant>0 else 0.0,"reduced":variant==2,"flashing":"reduced" if variant==3 else "full"})
	var viewport=SubViewport.new();viewport.size=Vector2i(360,720);viewport.transparent_bg=true;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;root.add_child(viewport)
	var painter=Control.new();painter.size=Vector2(360,720);viewport.add_child(painter);painter.draw.connect(paint.bind(painter))
	for fixture in fixtures:
		current=fixture;board.cursor={"x":fixture.x,"y":fixture.y};board.clock=fixture.time;board.rise=fixture.rise;board.reduce_motion=fixture.reduced;board.fx.flashing=fixture.flashing
		painter.queue_redraw();await process_frame;await RenderingServer.frame_post_draw
		viewport.get_texture().get_image().save_png("res://../.web-smoke/selector-native-"+fixture.id+".png")
	FileAccess.open("res://../.web-smoke/selector-fixtures.json",FileAccess.WRITE).store_string(JSON.stringify(fixtures))
	board.cursor={"x":4,"y":11}
	if board.cursor_at()!=board.cursor: push_error("Selector interpolated instead of snapping");quit(1);return
	board.queue_free();viewport.queue_free();await process_frame
	print("GODOT_SELECTOR_OK: 36 edge/palette/accessibility fixtures, instant cursor")
	quit(0)
