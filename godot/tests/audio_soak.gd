extends SceneTree
# Real elapsed-time battle playback. The separate title_audio_soak.gd check
# exercises title playback concurrently in its own muted audio-device process.
const Synth = preload("res://scripts/audio.gd")
var synth
var started = 0
var report_at = 0
var errors: Array = []
var prior_step = 0
var phase = -1
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	synth=root.get_node("MusicManager")
	synth.set_context("battle")
	started=Time.get_ticks_msec();report_at=started
func _process(_delta: float) -> bool:
	if synth==null: return false
	var elapsed=(Time.get_ticks_msec()-started)/1000.0
	var next_phase=int(elapsed/15)
	if next_phase!=phase:
		phase=next_phase
		synth.target=float(phase%3)/2.0
		synth.overdrive=phase%8==6;synth.surge=phase%8==4
		if phase%8==0: synth.set_context("title");synth.select_track(["neon","midnight","coast","chrome"][int(phase/8)%4])
		elif phase%8==1: synth.set_context("intro");synth.effect("countdown",3)
		elif phase%8==2: synth.set_context("battle");synth.effect("go")
		elif phase%8==7: synth.set_context("victory" if phase%16==7 else "defeat");synth.effect("win" if phase%16==7 else "lose")
		else: synth.set_context("battle");synth.effect(["pulse","shift","surge","overdrive"][phase%4])
		var before=synth.step
		synth.start_music();synth.select_track(synth.track_id)
		if synth.step!=before: errors.append("Idempotent start/selection reset step")
		synth.music_enabled=phase%12!=10;synth.sound_enabled=phase%12!=11
		synth.music_volume=.6 if phase%5==0 else .8
		synth.sfx_volume=.5 if phase%5==0 else .8
	if Time.get_ticks_msec()-report_at>=30000:
		report_at=Time.get_ticks_msec()
		if synth.step<=prior_step: errors.append("Playback clock stalled")
		prior_step=synth.step
		if synth.primary_players!=1 or synth.starts!=1: errors.append("Duplicate primary or restart")
		print("AUDIO_SOAK_PROGRESS seconds=%d steps=%d starts=%d skips=%d voices=%d peak=%.4f" % [elapsed,synth.step,synth.starts,synth.underruns,synth.mix_voices.size(),synth.output_peak])
	if elapsed>=900:
		if synth.underruns>0: errors.append("Audio generator underruns: "+str(synth.underruns))
		if synth.output_peak<=0 or synth.output_peak>=1: errors.append("Silent or clipped output")
		if not errors.is_empty():
			for error in errors: push_error(error)
		else: print("AUDIO_SOAK_OK: 900s live battle playback, no restarts/duplicate primary/underruns/clipping")
		synth.shutdown();quit(0 if errors.is_empty() else 1)
	return false
