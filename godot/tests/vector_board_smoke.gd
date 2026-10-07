extends SceneTree
const Board = preload("res://scripts/board_view.gd")
func _initialize() -> void: call_deferred("run")
func run() -> void:
	var board=Board.new()
	board.size=Vector2(360,720)
	root.add_child(board)
	board.reduce_motion=true
	var grid=[]
	for y in range(12):
		var row=[]
		for x in range(6): row.append(0 if y<5 else 1+(x+y)%4)
		grid.append(row)
	board.update_board({"grid":grid},{"cursor":{"x":2,"y":9}})
	await process_frame
	board.painter.queue_redraw()
	await process_frame
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	board.viewport.get_texture().get_image().save_png("res://../.web-smoke/vector-native.png")
	if board.cursor_at()!={"x":2,"y":9}: quit(1);return
	print("VECTOR_NATIVE_RENDER_OK")
	board.queue_free()
	await process_frame
	quit(0)
