extends SceneTree

const Network = preload("res://scripts/network.gd")
var client
var messages: Array = []
var address = "http://127.0.0.1:3000"
var mode = "duel"
var code = ""
var bots = 1
var failed = false

func _initialize() -> void:
	var args = OS.get_cmdline_user_args()
	for index in range(args.size()):
		match args[index]:
			"--url": address=args[index+1]
			"--mode": mode=args[index+1]
			"--code": code=args[index+1]
			"--bots": bots=int(args[index+1])
	call_deferred("run")

func check(condition: bool, detail: String) -> bool:
	if not condition:
		failed = true
		push_error(detail)
		quit(1)
	return condition

func wait_message(kind: String, predicate: Callable = Callable()) -> Dictionary:
	var deadline = Time.get_ticks_msec()+15000
	while Time.get_ticks_msec()<deadline:
		for index in range(messages.size()):
			var message = messages[index]
			if message.get("type")=="error":
				check(false,"Server error: "+str(message));return {}
			if message.get("type")==kind and (not predicate.is_valid() or predicate.call(message)):
				messages.remove_at(index)
				return message
		await process_frame
	check(false,"Timed out waiting for "+kind)
	return {}

func run() -> void:
	client = Network.new()
	root.add_child(client)
	client.received.connect(func(message): messages.append(message))
	client.connect_server(address)
	await wait_message("hello")
	if failed: return
	if code.is_empty():
		client.send_message({"type":"create","name":"Godot protocol QA","mode":mode,"ruleset":"rush","bots":bots,"difficulty":"easy","quick":true})
	else:
		client.send_message({"type":"join","name":"Godot cross-play QA","code":code})
	var lobby = await wait_message("lobby")
	if failed: return
	print("GODOT_LOBBY_READY "+str(lobby.room))
	await wait_message("start")
	var state = await wait_message("state",func(value): return value.countdown==0)
	if failed: return
	if not check(state.players.size()==(bots+1 if code.is_empty() else 2),"Incorrect seat count"): return
	if not check(state.self.cursor.x==2,"Unexpected initial cursor"): return
	if mode=="teams":
		if not check(state.teamRemaining.a==2 and state.teamRemaining.b==2,"Teams not balanced"): return
	client.send_message({"type":"move","dx":-1,"dy":0})
	state = await wait_message("state",func(value): return value.self.cursor.x==1)
	if failed: return
	var own = {}
	var enemy = {}
	for player in state.players:
		if player.id==client.player_id: own=player
		elif mode!="teams" or player.team!=state.team: enemy=player
	var x = -1
	var y = 11
	for row in range(11,6,-1):
		for col in range(5):
			if own.grid[row][col]!=own.grid[row][col+1] and own.grid[row][col]!=6 and own.grid[row][col+1]!=6:
				x=col;y=row;break
		if x>=0: break
	if not check(x>=0,"No legal test swap"): return
	var cursor = state.self.cursor
	for count in range(absi(x-int(cursor.x))): client.send_message({"type":"move","dx":signi(x-int(cursor.x)),"dy":0})
	for count in range(absi(y-int(cursor.y))): client.send_message({"type":"move","dx":0,"dy":signi(y-int(cursor.y))})
	state = await wait_message("state",func(value): return value.self.cursor.x==x and value.self.cursor.y==y)
	client.send_message({"type":"swap"})
	await wait_message("swap")
	client.send_message({"type":"target","id":enemy.id})
	state = await wait_message("state",func(value): return value.self.target==enemy.id)
	client.send_message({"type":"boost","active":true})
	await create_timer(.15).timeout
	client.send_message({"type":"boost","active":false})
	client.send_message({"type":"pulse"})
	if failed: return
	client.send_message({"type":"leave"})
	await wait_message("left")
	if failed: return
	print("GODOT_PROTOCOL_OK "+mode+" seats="+str(bots+1 if code.is_empty() else 2)+" input/swap/target/boost/leave" )
	client.queue_free()
	await process_frame
	quit(0)
