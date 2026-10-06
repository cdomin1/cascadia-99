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
	synth.shutdown()
	await create_timer(.2).timeout
	synth.queue_free()
	await process_frame
	quit(0)
