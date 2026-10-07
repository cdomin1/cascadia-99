extends SceneTree
const Targeting=preload("res://scripts/battle_targeting.gd")
var failed = false
func check(value: bool, detail: String) -> void:
	if not value: failed=true;push_error(detail)
func _initialize() -> void: call_deferred("run")
func run() -> void:
	var layer=Targeting.new();root.add_child(layer);layer.set_process(false)
	layer.match_id="m";layer.local_id="me";layer.enabled=true
	var message={"type":"sent","matchId":"m","eventId":"m:1","attackSequence":1,"sourceId":"me","targetId":"enemy","amount":18}
	check(layer.confirm(message,0),"Confirmed outgoing rejected");check(not layer.confirm(message,1),"Duplicate replayed")
	layer.begin("m","me",null,{},true);check(not layer.confirm(message,2),"Reconnect replayed effect")
	var fixtures: Array = []
	for channel in ["outgoing","incoming","reversal"]:
		for reduced in [false,true]:
			for now in [0,288,600,700]:
				var event={"channel":channel,"amount":18,"start":0}
				layer.reduced_motion=reduced;layer.flashing="reduced" if reduced else "full"
				fixtures.append({"event":event,"now":now,"reduced":reduced,"result":layer.pixels(event,now,Vector2(12,15),Vector2(300,600))})
	for n in range(2,30):
		message.attackSequence=n;message.eventId="m:"+str(n);message.type="attack";message.sourceId="enemy"+str(n);message.targetId="me"
		check(layer.confirm(message,0),"Incoming rejected")
	check(layer.events.size()==8,"Trajectory cap failed")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	FileAccess.open("res://../.web-smoke/targeting-parity.json",FileAccess.WRITE).store_string(JSON.stringify(fixtures))
	layer.queue_free();await process_frame
	print("GODOT_TARGETING_OK: actual IDs, incoming/outgoing, cap, reconnect dedup, accessibility and future color channel")
	quit(1 if failed else 0)
