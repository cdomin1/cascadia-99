extends SceneTree
const Synth = preload("res://scripts/audio.gd")

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	AudioServer.set_bus_mute(0,true)
	var synth=Synth.new()
	root.add_child(synth)
	synth.set_process(false)
	synth.render_only=true
	for id in ["neon","midnight","coast","chrome"]:
		synth.select_track(id)
		synth.target=0
		synth.start_music()
		for position in range(16):
			synth.remaining=0
			synth._process(.05)
		if synth.step!=16:
			push_error("Native sequencer did not advance: "+id);quit(1);return
		var peak=0
		for stream in synth.cache.values():
			if stream.format!=AudioStreamWAV.FORMAT_16_BITS or stream.data.size()==0:
				push_error("Invalid generated PCM stream");quit(1);return
			var pcm=stream.data
			for offset in range(0,pcm.size(),2): peak=maxi(peak,absi(pcm.decode_s16(offset)))
		if peak<=0 or peak>=32767:
			push_error("Native PCM is silent or clips");quit(1);return
		print("GODOT_AUDIO_OK "+id+" notes="+str(synth.cache.size())+" peak="+str(peak))
		synth.stop_music()
		synth.cache.clear()
	synth.music_enabled=false
	for ability in ["pulse","shift","surge","overdrive","garbage","clear"]:
		synth.cache.clear()
		synth.effect(ability,6,12)
		for frame in range(20): synth._process(.032)
		if synth.cache.is_empty() or not synth.sfx_queue.is_empty():
			push_error("Stinger failed with music muted: "+ability);quit(1);return
		for stream in synth.cache.values():
			var peak=0
			for offset in range(0,stream.data.size(),2): peak=maxi(peak,absi(stream.data.decode_s16(offset)))
			if peak<=0 or peak>=32767: push_error("Silent/clipped ability PCM: "+ability);quit(1);return
		synth.sound_enabled=false;synth.cache.clear();synth.effect(ability);synth._process(.5)
		if not synth.cache.is_empty(): push_error("SFX mute ignored");quit(1);return
		synth.sound_enabled=true
	print("GODOT_RETRO_AUDIO_OK: six stingers, non-silent unclipped PCM, independent music/SFX mute")
	synth.shutdown()
	await create_timer(.2).timeout
	synth.queue_free()
	await process_frame
	quit(0)
