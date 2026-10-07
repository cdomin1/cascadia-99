extends SceneTree
const Synth = preload("res://scripts/audio.gd")
var failed = false
func check(ok: bool, text: String) -> void:
	if not ok: failed=true;push_error(text)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	AudioServer.set_bus_mute(0,true)
	var synth=Synth.new()
	root.add_child(synth)
	synth.set_process(false);synth.render_only=true
	for id in ["neon","midnight","coast","chrome"]:
		synth.select_track(id);synth.target=0;synth.start_music()
		var first_step=synth.step
		var prior=0.0
		var jump=0.0
		var silent_blocks=0
		for block in range(512):
			if block%64==0:
				synth.set_context("battle" if block%128==0 else "title")
				synth.target=1.0 if block%128==0 else 0.0
			if block==128: synth.music_enabled=false
			if block==192: synth.music_enabled=true
			var pcm=synth.render_frames(1024)
			var peak=0.0
			for sample in pcm:
				peak=maxf(peak,absf(sample.x));jump=maxf(jump,absf(sample.x-prior));prior=sample.x
			if peak<.00001: silent_blocks+=1
		check(synth.step>first_step+64,"Phrase clock did not loop: "+id)
		check(synth.output_peak>0 and synth.output_peak<1,"Silent/clipped mixed PCM: "+id)
		check(silent_blocks==0,"Unexpected silent music buffers: "+id)
		check(jump<.65,"Abrupt PCM seam: "+id)
		var step_before=synth.step
		synth.select_track(id);synth.start_music();synth.set_context("intro");synth.set_context("battle")
		check(synth.step==step_before,"Same track/context restarted music")
		print("GODOT_AUDIO_OK "+id+" frames="+str(synth.rendered_frames)+" peak="+str(synth.output_peak)+" max_jump="+str(jump))
		synth.stop_music();synth.cache.clear();synth.pcm_cache.clear()
	synth.music_enabled=false
	for ability in ["pulse","shift","surge","overdrive","garbage","clear","confirm","countdown","go","win","lose"]:
		synth.cache.clear();synth.effect(ability,6,12)
		for frame in range(30): synth._process(.032)
		check(not synth.cache.is_empty() and synth.sfx_queue.is_empty(),"SFX failed with music muted: "+ability)
		synth.sound_enabled=false;synth.cache.clear();synth.effect(ability);synth._process(.5)
		check(synth.cache.is_empty(),"SFX mute ignored")
		synth.sound_enabled=true
	check(AudioServer.get_bus_index("Music")>=0 and AudioServer.get_bus_index("SFX")>=0,"Missing independent buses")
	synth.shutdown();synth.queue_free();await process_frame
	print("GODOT_AUDIO_POLISH_OK: four compositions, continuous sample clock, phase-preserving context/mute, independent SFX")
	quit(1 if failed else 0)
