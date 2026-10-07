extends SceneTree
var synth
var started = 0
var report_at = 0
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	synth=root.get_node("MusicManager")
	# Independent playback process: mute its output to avoid playing two songs over
	# one another while the battle soak runs. The audio device/buffer remain live.
	AudioServer.set_bus_mute(0,true)
	synth.set_context("title")
	started=Time.get_ticks_msec();report_at=started
func _process(_delta: float) -> bool:
	if synth==null: return false
	var elapsed=(Time.get_ticks_msec()-started)/1000.0
	if Time.get_ticks_msec()-report_at>=30000:
		report_at=Time.get_ticks_msec()
		print("TITLE_SOAK_PROGRESS seconds=%d steps=%d starts=%d skips=%d" % [elapsed,synth.step,synth.starts,synth.underruns])
	if elapsed>=600:
		var good=synth.starts==1 and synth.primary_players==1 and synth.underruns==0 and synth.output_peak>0 and synth.output_peak<1
		if good: print("TITLE_AUDIO_SOAK_OK: 600s live device playback, no restarts/duplicate primary/underruns/clipping; output muted")
		else: push_error("Title live audio soak failed")
		synth.shutdown();quit(0 if good else 1)
	return false
