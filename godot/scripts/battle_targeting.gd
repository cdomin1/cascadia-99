extends Control

# Single capped presentation layer; endpoints come from confirmed server IDs only.
const Effects = preload("res://scripts/presentation_effects.gd")
var config: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/targeting-vfx.json"))
var match_id = ""
var local_id = ""
var last_sequence = 0
var events: Array = []
var main_board: Control
var rivals: Dictionary = {}
var reduced_motion = false
var flashing = "full"
var enabled = false
var font_pixels = Effects.new()
func _ready() -> void:
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
func begin(id: String, player: String, own: Control, opponents: Dictionary, battle: bool) -> void:
	if match_id!=id: events.clear();last_sequence=0
	match_id=id;local_id=player;main_board=own;rivals=opponents;enabled=battle
func confirm(message: Dictionary, now: float = Time.get_ticks_msec()) -> bool:
	if not enabled or not message.get("type") in ["sent","attack"] or str(message.get("matchId",""))!=match_id: return false
	var sequence=int(message.get("attackSequence",0))
	if sequence<=last_sequence or str(message.get("eventId",""))!=match_id+":"+str(sequence): return false
	var source=str(message.get("sourceId",""));var target=str(message.get("targetId",""))
	var amount=float(message.get("amount",0))
	if source.is_empty() or target.is_empty() or source==target or amount<=0: return false
	var channel="outgoing" if message.type=="sent" and source==local_id else ("incoming" if message.type=="attack" and target==local_id else "")
	if channel.is_empty(): return false
	last_sequence=sequence
	events.append({"sourceId":source,"targetId":target,"amount":amount,"channel":channel,"start":now,"eventId":message.eventId})
	if events.size()>int(config.maxActive): events=events.slice(-int(config.maxActive))
	var other=target if channel=="outgoing" else source
	if rivals.has(other):
		rivals[other].attack_mark=channel
		rivals[other].attack_until=Time.get_ticks_msec()+float(config.durationMs)+float(config.impactMs)
	return true
func pixels(event: Dictionary, now: float, from: Vector2, to: Vector2) -> Dictionary:
	var age=now-event.start
	var color=str(config.colors[event.channel])
	if age<0 or age>=float(config.durationMs)+float(config.impactMs): return {"rects":[],"impact":false,"color":color}
	var strength=clampi(int(ceil(event.amount/6.0)),1,4)
	var pixel=int(config.pixel);var extent=pixel*(2 if strength>=3 else 1)
	var progress=minf(1,floorf(age/float(config.stepMs))*float(config.stepMs)/float(config.durationMs))
	var rects: Array = []
	var count=9 if reduced_motion else 3+strength
	for n in range(count):
		var t=n/float(count-1) if reduced_motion else progress-n*.045
		if t<0 or t>1 or (not reduced_motion and age>=float(config.durationMs)): continue
		var point=from.lerp(to,t)
		rects.append([roundf(point.x/pixel)*pixel,roundf(point.y/pixel)*pixel,extent,extent])
	if flashing=="full" and age>=float(config.durationMs) and int(age/float(config.stepMs))%2==0: color="#FFFFFF"
	return {"rects":rects,"impact":age>=float(config.durationMs),"color":color}
func _process(_delta: float) -> void:
	var now=Time.get_ticks_msec()
	events=events.filter(func(event): return now-event.start<float(config.durationMs)+float(config.impactMs))
	for view in rivals.values():
		if is_instance_valid(view) and view.attack_until>0:
			if now>=view.attack_until: view.attack_mark="";view.attack_until=-1
			view.queue_redraw()
	if enabled: queue_redraw()
func _draw() -> void:
	if not enabled or not is_instance_valid(main_board): return
	for event in events:
		var source=main_board if event.sourceId==local_id else rivals.get(event.sourceId)
		var dest=main_board if event.targetId==local_id else rivals.get(event.targetId)
		if not is_instance_valid(source) or not is_instance_valid(dest): continue
		var a=source.get_global_rect();var b=dest.get_global_rect()
		var from=Vector2(a.position.x if b.position.x<a.position.x else a.end.x,a.position.y+a.size.y*.3)
		var to=Vector2(b.position.x if a.position.x<b.position.x else b.end.x,b.position.y+b.size.y*.3)
		var sample=pixels(event,Time.get_ticks_msec(),from,to)
		for i in range(1,sample.rects.size()):
			var prev=sample.rects[i-1];var next=sample.rects[i]
			var color=Color(sample.color);color.a=.55 if reduced_motion else 1-i/float(sample.rects.size()+1)
			draw_line(Vector2(prev[0],prev[1]),Vector2(next[0],next[1]),color,1.5,true)
		if not sample.rects.is_empty():
			var head=sample.rects[0];var center=Vector2(head[0],head[1]);var radius=float(head[2])
			draw_polyline(PackedVector2Array([center+Vector2(0,-radius),center+Vector2(radius,0),center+Vector2(0,radius),center+Vector2(-radius,0),center+Vector2(0,-radius)]),Color(sample.color),1.5,true)
		if sample.impact: draw_rect(b.grow(-1.5),Color(sample.color),false,3)
