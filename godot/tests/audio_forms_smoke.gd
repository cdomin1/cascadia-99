extends SceneTree
const Synth=preload("res://scripts/audio.gd")
func _initialize() -> void: call_deferred("run")
func run() -> void:
	var failed=false
	for id in ["neon","midnight","coast","chrome"]:
		var synth=Synth.new();synth.render_only=true;synth.tracks=synth.score.tracks;synth.track_id=id;synth.start_music()
		var total=ceili(synth.tracks[id].duration*2*synth.SAMPLE_RATE)
		var frames=0;var squares=0.0;var peak=0.0;var jump=0.0;var prior=0.0;var silence=0;var longest=0
		while frames<total:
			var progress=frames/float(total)
			synth.target=1.0 if progress>.75 else (.75 if progress>.5 else .1);synth.overdrive=progress>.8
			var pcm=synth.render_frames(mini(1024,total-frames))
			for sample in pcm:
				peak=maxf(peak,maxf(absf(sample.x),absf(sample.y)));squares+=sample.length_squared();jump=maxf(jump,absf(sample.x-prior));prior=sample.x
				if sample.length_squared()<.0000000001: silence+=1;longest=maxi(longest,silence)
				else: silence=0
			frames+=pcm.size()
		var rms=sqrt(squares/(total*2))
		print("NATIVE_FORMS %s frames=%d steps=%d peak=%.5f rms=%.5f longest_rest=%.3fs jump=%.4f" % [id,total,synth.step,peak,rms,longest/float(synth.SAMPLE_RATE),jump])
		if synth.step<2048 or peak>=1 or rms<.04 or longest>synth.SAMPLE_RATE*2 or jump>.65: failed=true
		synth.free()
	print("NATIVE_TWO_LOOP_FORMS_OK" if not failed else "NATIVE_FORMS_FAILED")
	quit(1 if failed else 0)
