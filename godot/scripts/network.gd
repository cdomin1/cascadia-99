extends Node

signal received(message: Dictionary)
signal connection_changed(connected: bool, detail: String)
var socket: WebSocketPeer
var player_id = ""
var endpoint = ""
var was_open = false
var connecting = false
var resume_token = ""
var pending_resume = ""
var retry_remaining = -1.0
var server_address = ""
var ability_sequence = 0
var ability_session = str(Time.get_ticks_usec())

func connect_server(address: String, recover: bool = false) -> void:
	server_address=address
	pending_resume=resume_token if recover else ""
	if not recover: resume_token=""
	retry_remaining=-1
	if socket != null:
		socket.close()
	player_id = ""
	was_open = false
	connecting = true
	endpoint = address.strip_edges().trim_suffix("/")
	if endpoint.begins_with("http://"):
		endpoint = "ws://" + endpoint.substr(7)
	elif endpoint.begins_with("https://"):
		endpoint = "wss://" + endpoint.substr(8)
	if not endpoint.ends_with("/socket"):
		endpoint += "/socket"
	if not (endpoint.begins_with("ws://") or endpoint.begins_with("wss://")):
		connecting = false
		connection_changed.emit(false, "Use an http(s) or ws(s) game server address.")
		return
	socket = WebSocketPeer.new()
	# A complete 99-player state can exceed the default 65KB receive buffer.
	socket.inbound_buffer_size = 2097152
	socket.outbound_buffer_size = 65536
	socket.max_queued_packets = 256
	var result = socket.connect_to_url(endpoint)
	if result != OK:
		connecting = false
		connection_changed.emit(false, "Could not connect: " + error_string(result))
	else:
		connection_changed.emit(false, "Connecting to game server...")

func send_message(message: Dictionary) -> bool:
	if socket == null or socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return false
	return socket.send_text(JSON.stringify(message)) == OK

func send_ability(ability: String) -> bool:
	ability_sequence+=1
	return send_message({"type":"ability","ability":ability,"requestId":ability_session+":"+str(ability_sequence)})

func _process(_delta: float) -> void:
	if retry_remaining>=0:
		retry_remaining-=_delta
		if retry_remaining<=0: connect_server(server_address,true)
	if socket == null:
		return
	socket.poll()
	var state = socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		was_open = true
		while socket.get_available_packet_count() > 0:
			var value = JSON.parse_string(socket.get_packet().get_string_from_utf8())
			if value is Dictionary:
				if value.get("type") == "hello":
					player_id = str(value.id)
					resume_token=value.get("resumeToken","")
					send_message({"type":"session","resumable":true})
					if not pending_resume.is_empty(): send_message({"type":"resume","token":pending_resume})
					connecting = false
					connection_changed.emit(true, "Connected")
				if value.get("type")=="resumed":
					player_id=str(value.id)
					resume_token=value.resumeToken
				if value.get("type")=="resumeRejected": resume_token="";pending_resume=""
				received.emit(value)
	elif state == WebSocketPeer.STATE_CLOSED and (was_open or connecting):
		was_open = false
		connecting = false
		connection_changed.emit(false, "Disconnected. Recovering session; match continues.")
		if not resume_token.is_empty(): retry_remaining=.75

func _exit_tree() -> void:
	if socket != null:
		socket.close(1000, "Client closed")
