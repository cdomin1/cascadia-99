extends SceneTree
var failed=false
func check(ok: bool, message: String) -> void:
	if not ok: failed=true;push_error(message)
func _initialize() -> void: call_deferred("run")
func run() -> void:
	var audio=root.get_node("AudioManager")
	check(audio.cache.size()==69,"Prebuilt SFX cache missing")
	check(audio.tracks.is_empty(),"Expected empty soundtrack library")
	for context in ["title","intro","battle","victory","defeat","title"]:
		audio.set_context(context)
		check(not audio.start_music() and audio.music.players.is_empty(),"Empty library created playback")
	# A stale/missing registry entry must not load or generate fallback music.
	audio.tracks["missing"]={"id":"missing","title":"Missing","category":"menu","path":"menu/missing.ogg"}
	audio.select_track("missing")
	check(not audio.start_music() and audio.music.players.is_empty(),"Missing file created playback")
	audio.tracks.clear();audio.music.preferred.clear()
	audio.music_enabled=false
	for cue in ["move","swap","clear","garbage","incoming","glitchBreak","flux","pulse","shift","surge","overdrive","danger","critical","ko","win","lose","confirm","back","countdown","go"]:
		var before=audio.played_effects
		audio.effect(cue,3,6)
		for frame in range(30): audio._process(.032)
		check(audio.played_effects>before and audio.sfx_queue.is_empty(),"SFX failed with no music: "+cue)
		audio.sound_enabled=false;before=audio.played_effects;audio.effect(cue)
		check(audio.played_effects==before,"SFX mute ignored")
		audio.sound_enabled=true
		await process_frame
	check(audio.voices.size()<=32,"SFX voice cap exceeded")
	check(audio.music.players.is_empty() and audio.music.starts==0,"Unexpected music source")
	check(AudioServer.get_bus_index("Music")>=0 and AudioServer.get_bus_index("SFX")>=0,"Missing category buses")
	audio.shutdown();await create_timer(.15).timeout
	print("GODOT_SFX_ONLY_OK: empty/missing library, event SFX, independent mute, voice cap, buses, shutdown")
	quit(1 if failed else 0)
