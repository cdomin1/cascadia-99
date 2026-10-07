extends Control

# One presentation clock, derived from the server deadline. Never pauses simulation.
signal cue(kind: String, value: int)
const Effects = preload("res://scripts/presentation_effects.gd")
var font_pixels = Effects.new()
var server_clock: Callable
var board: Control
var match_id = ""
var countdown_at = -1.0
var start_at = -1.0
var reduced_motion = false
var flashing = "full"
var shake = "normal"
var last_label = ""
var current_label = "CONNECTING"
var resumed = false
var finished = false
var scheduled_at = -1.0
var go_emitted = false

func _ready() -> void:
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func begin(message: Dictionary, view: Control, clock: Callable) -> void:
	board=view;server_clock=clock;match_id=str(message.matchId)
	resumed=message.get("resumed",false)
	board.painter.draw.connect(paint_board.bind(board.painter))
	schedule(message)

func schedule(message: Dictionary) -> void:
	if str(message.get("matchId",""))!=match_id or message.get("startAt")==null: return
	if start_at>=0: return # duplicate snapshots and scheduling packets are harmless
	countdown_at=float(message.countdownAt);start_at=float(message.startAt)
	scheduled_at=countdown_at-1000.0
	if resumed and server_clock.call()>=start_at:
		finished=true;go_emitted=true;current_label="";last_label="GO!"

func can_play() -> bool:
	return start_at>=0 and server_clock.is_valid() and server_clock.call()>=start_at

func _process(_delta: float) -> void:
	if not server_clock.is_valid() or not is_instance_valid(board): return
	var now: float = server_clock.call()
	current_label="WAITING"
	if start_at>=0:
		if now<countdown_at:
			current_label="READY?" if now>=countdown_at-250 or reduced_motion else ""
		elif now<start_at:
			current_label=str(clampi(int(ceil((start_at-now)/1000.0)),1,3))
		elif now<start_at+640 and not finished: current_label="GO!"
		else: current_label="";finished=true
	if start_at>=0 and now>=start_at and not go_emitted:
		go_emitted=true;cue.emit("go",0)
		if not reduced_motion and shake!="off" and now<start_at+160: board.fx.trigger("attack")
	if current_label!=last_label:
		last_label=current_label
		if current_label in ["3","2","1"]: cue.emit("countdown",4-int(current_label))
	board.painter.queue_redraw()
	queue_redraw()

func _draw() -> void:
	if reduced_motion or resumed or not server_clock.is_valid(): return
	if scheduled_at<0:
		draw_rect(Rect2(Vector2.ZERO,size),Color("#10131A"))
		font_pixels.bitmap_text(self,"LOADING",Vector2(Effects.snap(size.x/2-63),Effects.snap(size.y/2)),3,Color("#38FFFF"))
		return
	var age: float = server_clock.call()-scheduled_at
	if age<0 or age>=500: return
	# Fifteen discrete diagonal tile-reveal frames; no full-screen flashing.
	var frame = int(age/32)
	for y in range(int(ceil(size.y/32.0))):
		for x in range(int(ceil(size.x/32.0))):
			if (x+y)%16>=frame: draw_rect(Rect2(x*32,y*32,32,32),Color("#10131A"))

func paint_board(view: Control) -> void:
	if not server_clock.is_valid(): return
	var now: float = server_clock.call()
	if not resumed and not reduced_motion and scheduled_at>=0:
		var reveal = now-scheduled_at-500
		if reveal<250:
			var rows = maxi(0,int(reveal/32)*2)
			for row in range(rows,24): view.draw_rect(Rect2(0,row*30,360,30),Color("#10131A"))
	if current_label.is_empty(): return
	var unit = 9 if current_label in ["3","2","1"] else 6
	var point = Vector2(Effects.snap((360-(current_label.length()*6-1)*unit)/2.0),Effects.snap((720-7*unit)/2.0))
	# Small opaque backing keeps both the board and the countdown readable.
	view.draw_rect(Rect2(point-Vector2(9,9),Vector2((current_label.length()*6-1)*unit+18,7*unit+18)),Color("#10131A"))
	font_pixels.bitmap_text(view,current_label,point,unit,Color("#38FFFF") if current_label=="GO!" else Color.WHITE)
	if current_label=="GO!" and not reduced_motion:
		var frame = int((now-start_at)/32)
		for i in range(12):
			var direction = Vector2.from_angle(i*TAU/12.0)
			var pos = Vector2(180,360)+direction*(60+frame*6)
			pos=Vector2(Effects.snap(pos.x),Effects.snap(pos.y))
			var row=clampi(int(pos.y/60),0,11)
			var col=clampi(int(pos.x/60),0,5)
			if board.grid.is_empty() or board.grid[row][col]==0:
				view.draw_rect(Rect2(pos,Vector2(6,6)),Color("#38FFFF"))
