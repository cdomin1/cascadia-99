extends Node
# File-backed playback only. No oscillators, sequencer, worker or fallback music.
var tracks: Dictionary = {}
var preferred: Dictionary = {}
var context="title"
var requested=false
var music_player: AudioStreamPlayer
var players: Array = []
var starts=0
const BASE="res://assets/audio/music/"
func _ready() -> void:
	set_process(false)
	if not FileAccess.file_exists(BASE+"manifest.json"): return
	var manifest=JSON.parse_string(FileAccess.get_file_as_string(BASE+"manifest.json"))
	if not manifest is Dictionary or not manifest.get("tracks",[]) is Array: return
	var valid_id=RegEx.new();valid_id.compile("^[a-zA-Z0-9_-]+$")
	var valid_path=RegEx.new();valid_path.compile("(?i)^(menu|gameplay|results|stems)/[a-zA-Z0-9_./ -]+\\.(ogg|mp3|wav)$")
	for item in manifest.tracks:
		if not item is Dictionary: continue
		var id=item.get("id","");var path=item.get("path","");var title=item.get("title","")
		if not id is String or id.is_empty() or tracks.has(id) or not title is String or not path is String: continue
		if valid_id.search(id)==null: continue
		if title.strip_edges().is_empty() or (item.has("loop") and not item.loop is bool): continue
		if valid_path.search(path)==null or path.contains("..") or path.contains("//") or not ["menu","gameplay","results","stems"].has(item.get("category")): continue
		var begin=item.get("loopStart",0);var end=item.get("loopEnd",null)
		if not (begin is float or begin is int) or not is_finite(begin) or begin<0: continue
		if end!=null and (not (end is float or end is int) or not is_finite(end) or end<=begin): continue
		if not FileAccess.file_exists(BASE+path) or not ResourceLoader.exists(BASE+path,"AudioStream"): continue
		tracks[id]=item
func category() -> String:
	return "gameplay" if context=="battle" else ("results" if context in ["victory","defeat"] else "menu")
func selected() -> String:
	if preferred.has(category()): return preferred[category()]
	for id in tracks:
		if tracks[id].category==category(): return id
	return ""
func select_track(id: String) -> bool:
	if not tracks.has(id): return false
	preferred[tracks[id].category]=id
	if requested and tracks[id].category==category(): start_music()
	return true
func set_context(value: String) -> void:
	context=value
	if requested: start_music()
func fade(player: AudioStreamPlayer, target: float, seconds: float, remove: bool=false) -> void:
	if not is_instance_valid(player): return
	var previous=player.get_meta("fade",null)
	if previous!=null and previous.is_valid(): previous.kill()
	var tween=create_tween();player.set_meta("fade",tween)
	tween.tween_method(func(value):
		if is_instance_valid(player): player.volume_db=linear_to_db(maxf(value,.0001)),db_to_linear(player.volume_db),target,seconds)
	if remove: tween.tween_callback(func(): cleanup(player))
func cleanup(player: AudioStreamPlayer) -> void:
	if music_player==player: music_player=null;set_process(false)
	players.erase(player)
	if is_instance_valid(player):
		var tween=player.get_meta("fade",null)
		if tween!=null and tween.is_valid(): tween.kill()
		player.stop();player.queue_free()
func start_music() -> bool:
	requested=true
	var id=selected()
	if id.is_empty(): stop_music(true);return false
	if is_instance_valid(music_player) and music_player.get_meta("track_id","")==id and music_player.playing: return true
	var track=tracks[id];var path=BASE+track.path
	if not FileAccess.file_exists(path) or not ResourceLoader.exists(path,"AudioStream"): stop_music(true);return false
	var resource=load(path)
	if not resource is AudioStream: stop_music(true);return false
	var stream=resource.duplicate()
	if not stream is AudioStream: stop_music(true);return false
	var begin=float(track.get("loopStart",0));var end=track.get("loopEnd",null)
	if begin>=stream.get_length() or (end!=null and end>stream.get_length()): stop_music(true);return false
	if stream is AudioStreamWAV:
		stream.loop_mode=AudioStreamWAV.LOOP_FORWARD if track.get("loop",false) else AudioStreamWAV.LOOP_DISABLED
		stream.loop_begin=int(begin*stream.mix_rate);stream.loop_end=int((float(end) if end!=null else stream.get_length())*stream.mix_rate)
	elif stream is AudioStreamOggVorbis or stream is AudioStreamMP3:
		stream.loop=track.get("loop",false);stream.loop_offset=begin
	var prior=music_player
	var player=AudioStreamPlayer.new();player.stream=stream;player.bus="Music";player.volume_db=-80
	player.set_meta("track_id",id);player.set_meta("custom_end",float(end) if end!=null and not stream is AudioStreamWAV and track.get("loop",false) else -1.0);player.set_meta("loop_start",begin)
	add_child(player);players.append(player);music_player=player
	player.finished.connect(func(): cleanup(player));player.play();starts+=1
	fade(player,1,.2);fade(prior,0,.15,true);set_process(player.get_meta("custom_end")>0)
	return true
func stop_music(retain_request: bool=false) -> void:
	if not retain_request: requested=false
	var prior=music_player;music_player=null;set_process(false);fade(prior,0,.15,true)
func _process(_delta: float) -> void:
	if not is_instance_valid(music_player): set_process(false);return
	var end=float(music_player.get_meta("custom_end",-1))
	var position=music_player.get_playback_position()+AudioServer.get_time_since_last_mix()
	if end>0 and position>=end: music_player.play(float(music_player.get_meta("loop_start"))+fmod(position-end,end-float(music_player.get_meta("loop_start"))))
func shutdown() -> void:
	requested=false
	for player in players.duplicate(): cleanup(player)
