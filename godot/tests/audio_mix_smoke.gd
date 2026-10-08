extends SceneTree
# Actual device/bus capture after the final limiter, before Master fader. No speaker/listening claim.
var synth
var capture: AudioEffectCapture
var started=0
var phase=-1
var frames=0
var peak=0.0
var squares=0.0
var failed=false
func _initialize() -> void: call_deferred("run")
func run() -> void:
	synth=root.get_node("AudioManager")
	capture=AudioEffectCapture.new();capture.buffer_length=.5
	AudioServer.add_bus_effect(0,capture)
	synth.set_context("battle");started=Time.get_ticks_msec()
func _process(_delta: float) -> bool:
	if synth==null: return false
	var elapsed=(Time.get_ticks_msec()-started)/1000.0
	var next=int(elapsed)
	if next!=phase:
		phase=next
		assert(synth.music.players.is_empty())
		if phase>=2:
			for cue in ["clear","incoming","glitchBreak","flux","pulse","shift","surge","overdrive","ko"]: synth.effect(cue,6,12)
		var before=synth.music.starts
		synth.start_music();synth.set_context("battle")
		assert(synth.music.starts==before)
	var pcm=capture.get_buffer(capture.get_frames_available())
	for captured in pcm:
		var value=captured*db_to_linear(AudioServer.get_bus_volume_db(0))
		peak=maxf(peak,maxf(absf(value.x),absf(value.y)));squares+=value.length_squared();frames+=1
	if elapsed>=30:
		var rms=sqrt(squares/maxi(1,frames*2))
		print("NATIVE_MIX_CAPTURE frames=%d peak=%.5f rms=%.5f music_players=%d starts=%d" % [frames,peak,rms,synth.music.players.size(),synth.music.starts])
		failed=peak>=.99 or rms<.01 or synth.music.starts!=0
		synth.shutdown();AudioServer.remove_bus_effect(0,AudioServer.get_bus_effect_count(0)-1)
		quit(1 if failed else 0)
	return false
