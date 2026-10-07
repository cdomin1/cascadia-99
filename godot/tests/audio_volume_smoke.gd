extends SceneTree
## Capture is after limiter but before the Master fader; apply its actual bus gain.
var synth
var capture: AudioEffectCapture
var started=0
var phase=-1
var last_cue=0.0
var peak=0.0
var squares=0.0
var frames=0
var failed=false
const VALUES=[0.0,.25,.5,.75,1.0]
func _initialize() -> void: call_deferred("run")
func run() -> void:
	synth=root.get_node("MusicManager");synth.set_context("battle")
	capture=AudioEffectCapture.new();capture.buffer_length=.5;AudioServer.add_bus_effect(0,capture)
	started=Time.get_ticks_msec()
func report() -> void:
	if phase<0: return
	var category=["master","music","sfx"][int(phase/5)]
	var value=VALUES[phase%5]
	var rms=sqrt(squares/maxi(1,frames*2))
	print("NATIVE_VOLUME %s %.2f peak=%.6f rms=%.6f" % [category,value,peak,rms])
	if peak>=.99 or (value==0 and peak>.00001) or (value>0 and peak<.001): failed=true
func _process(_delta: float) -> bool:
	if synth==null: return false
	var elapsed=(Time.get_ticks_msec()-started)/1000.0
	var next=int(elapsed/2)
	if next!=phase:
		report()
		if next>=15:
			synth.shutdown();AudioServer.remove_bus_effect(0,AudioServer.get_bus_effect_count(0)-1);quit(1 if failed else 0);return false
		phase=next;peak=0;squares=0;frames=0;capture.clear_buffer()
		var category=["master","music","sfx"][int(phase/5)]
		synth.master_volume=1;synth.music_volume=0 if category=="sfx" else 1;synth.sfx_volume=1 if category=="sfx" else 0
		synth.set(category+"_volume",VALUES[phase%5])
	if phase>=10 and elapsed-last_cue>.2: synth.effect("overdrive");last_cue=elapsed
	var pcm=capture.get_buffer(capture.get_frames_available())
	# Exclude settling/voice tails from the first second of each point.
	if fmod(elapsed,2.0)>1.0:
		for captured in pcm:
			var sample=captured*db_to_linear(AudioServer.get_bus_volume_db(0))
			peak=maxf(peak,maxf(absf(sample.x),absf(sample.y)));squares+=sample.length_squared();frames+=1
	return false
