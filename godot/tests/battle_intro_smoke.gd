extends SceneTree
const Intro = preload("res://scripts/battle_intro.gd")
const Board = preload("res://scripts/board_view.gd")
var now = 1000.0
var failed = false
var cues: Array = []
func check(ok: bool, detail: String) -> void:
	if not ok: failed=true;push_error(detail)
func _initialize() -> void: call_deferred("run")
func make_intro(resumed: bool = false, motion: bool = false):
	var board=Board.new();board.size=Vector2(360,720);root.add_child(board)
	board.grid=Array();for row in range(12): board.grid.append([1,2,3,4,1,2] if row>6 else [0,0,0,0,0,0])
	var intro=Intro.new();intro.reduced_motion=motion;intro.shake="off" if motion else "normal";intro.flashing="reduced" if motion else "full"
	root.add_child(intro);intro.set_process(false)
	intro.cue.connect(func(kind,value): cues.append([kind,value]))
	intro.begin({"matchId":"test","countdownAt":2000.0,"startAt":5000.0,"resumed":resumed},board,func(): return now)
	return intro
func run() -> void:
	root.size=Vector2i(800,800)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	var intro=make_intro()
	for sample in [[1000,""],[1800,"READY?"],[2000,"3"],[2999,"3"],[3000,"2"],[3999,"2"],[4000,"1"],[4999,"1"],[5000,"GO!"],[5300,"GO!"],[5700,""]]:
		now=float(sample[0]);intro._process(0)
		check(intro.current_label==sample[1],"Incorrect intro stage at "+str(now))
		check(intro.can_play()==(now>=5000),"Input gate drift")
		intro.schedule({"matchId":"test","countdownAt":9999,"startAt":12999})
		check(intro.start_at==5000,"Duplicate start shifted countdown")
		if now in [1000.0,1800.0,2000.0,3000.0,4000.0,5000.0]:
			await process_frame;await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://../.web-smoke/intro-%d.png" % now)
	check(cues==[["countdown",1],["countdown",2],["countdown",3],["go",0]],"Repeated or missing audio cues")
	intro.board.queue_free();intro.queue_free();await process_frame
	cues.clear();now=6500
	var resumed=make_intro(true);resumed._process(0)
	check(resumed.current_label.is_empty() and cues.is_empty() and resumed.can_play(),"Active reconnect replayed intro")
	resumed.board.queue_free();resumed.queue_free();await process_frame
	cues.clear();now=3500
	var countdown_resume=make_intro(true,true);countdown_resume._process(0)
	check(countdown_resume.current_label=="2","Countdown resume restarted at 3")
	now=5000;countdown_resume._process(0)
	check(countdown_resume.board.fx.impacts.is_empty(),"Reduced motion/shake off ignored")
	countdown_resume.board.queue_free();countdown_resume.queue_free();await process_frame
	cues.clear();now=1000
	var stalled=make_intro();now=7000;stalled._process(0);stalled._process(0)
	check(cues==[["go",0]] and stalled.current_label.is_empty(),"Late frame failed to enter battle once")
	stalled.board.queue_free();stalled.queue_free();await process_frame
	print("GODOT_INTRO_OK: exact 3/2/1 boundaries, GO gate, duplicate starts, loading stall, resumed countdown/active, reduced effects")
	quit(1 if failed else 0)
