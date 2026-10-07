extends Node

var tracks: Dictionary = {}
var track_id = "neon"
var music_enabled = true:
	set(value):
		music_enabled=value
		if AudioServer.get_bus_index("Music")>=0: AudioServer.set_bus_mute(AudioServer.get_bus_index("Music"),not value)
var sound_enabled = true:
	set(value):
		sound_enabled=value
		if AudioServer.get_bus_index("SFX")>=0: AudioServer.set_bus_mute(AudioServer.get_bus_index("SFX"),not value)
var music_volume = .8:
	set(value):
		music_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("Music")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),linear_to_db(maxf(music_volume,.0001)))
var sfx_volume = .8:
	set(value):
		sfx_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("SFX")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),linear_to_db(maxf(sfx_volume,.0001)))
var playing = false
var render_only = false
var target = 0.0
var intensity = 0.0
var overdrive = false
var surge = false
var context = "title"
var context_gain = .7
var desired_gain = .7
var pending_track = ""
var music_player: AudioStreamPlayer
var playback: AudioStreamGeneratorPlayback
var mix_voices: Array = []
var pcm_cache: Dictionary = {}
var sample_remaining = 0
var rendered_frames = 0
var starts = 0
var output_peak = 0.0
var underruns = 0
var primary_players = 0
var worker: Thread
var worker_mutex = Mutex.new()
var worker_stop = false
var worker_buffers: Array = []
var worker_controls: Dictionary = {}
var worker_stats: Dictionary = {}
var output_origin = 0.0
var context_deadline = -1.0
var future_context = ""
var renderer
var context_frame = -1
var frame_context = ""
var step = 0
var remaining = 0.0
var voices: Array = []
var cache: Dictionary = {}
var current_chord: Array = []
var sfx_queue: Array = []
const SAMPLE_RATE = 16000

func _ready() -> void:
	tracks = JSON.parse_string(FileAccess.get_file_as_string("res://assets/tracks.json"))
	for bus in ["Music","SFX"]:
		if AudioServer.get_bus_index(bus)<0:
			AudioServer.add_bus();AudioServer.set_bus_name(AudioServer.bus_count-1,bus)
			AudioServer.set_bus_send(AudioServer.bus_count-1,"Master")
	# Catch combined music/SFX peaks without altering the compositions.
	if AudioServer.get_bus_effect_count(0)==0:
		var limiter=AudioEffectLimiter.new()
		limiter.ceiling_db=-1
		AudioServer.add_bus_effect(0,limiter)
	music_volume=music_volume;sfx_volume=sfx_volume
	music_enabled=music_enabled;sound_enabled=sound_enabled

func select_track(id: String) -> void:
	if not tracks.has(id) or (id==track_id and pending_track.is_empty()): return
	if playing: pending_track=id # change at the next bar, preserving the phrase clock
	else: track_id=id

func schedule_context(value: String, seconds: float) -> void:
	future_context=value;context_deadline=Time.get_ticks_msec()+maxf(0,seconds)*1000.0

func set_context(value: String) -> void:
	if value=="battle" and future_context=="battle" and context_deadline>=0:
		# The worker already has the exact GO cue; don't replace it with a late command.
		context=value
		return
	future_context="";context_deadline=-1
	context=value
	desired_gain=.28 if value=="intro" else (.45 if value in ["victory","defeat"] else (.7 if value=="title" else 1.0))
	if value=="title": target=0;overdrive=false;surge=false
	start_music()

func start_music() -> void:
	if playing: return
	playing=true;starts+=1
	step=0;sample_remaining=0;remaining=0;intensity=target
	if render_only: return
	if not is_instance_valid(music_player):
		music_player=AudioStreamPlayer.new()
		music_player.name="PrimaryMusic";music_player.bus="Music"
		var generator=AudioStreamGenerator.new()
		generator.mix_rate=SAMPLE_RATE;generator.buffer_length=.5
		music_player.stream=generator
		add_child(music_player);primary_players=1
	worker_stop=false;worker_buffers.clear();worker_stats.clear()
	renderer=get_script().new()
	renderer.tracks=tracks;renderer.track_id=track_id;renderer.render_only=true
	renderer.context_gain=context_gain;renderer.desired_gain=desired_gain
	worker=Thread.new()
	worker.start(_music_worker)

func stop_music() -> void:
	playing=false
	if worker!=null:
		worker_mutex.lock();worker_stop=true;worker_mutex.unlock()
		worker.wait_to_finish();worker=null
		if is_instance_valid(renderer): renderer.free()
		renderer=null
	if is_instance_valid(music_player): music_player.stop()
	playback=null;mix_voices.clear();future_context="";context_deadline=-1

func _music_worker() -> void:
	while true:
		worker_mutex.lock()
		var stopping=worker_stop
		var full=worker_buffers.size()>=32
		var controls=worker_controls.duplicate()
		worker_mutex.unlock()
		if stopping: return
		if full: OS.delay_msec(2);continue
		if not controls.is_empty():
			renderer.target=controls.target;renderer.overdrive=controls.overdrive;renderer.surge=controls.surge
			renderer.desired_gain=controls.gain
			if not str(controls.track).is_empty(): renderer.pending_track=str(controls.track) if controls.track!=renderer.track_id else ""
			if controls.deadline>=0 and controls.origin>0:
				renderer.context_frame=int((controls.deadline-controls.origin)*SAMPLE_RATE/1000.0)
				renderer.frame_context=controls.future
			else: renderer.context_frame=-1
		var buffer=renderer.render_frames(512)
		worker_mutex.lock()
		worker_buffers.append(buffer)
		worker_stats={"step":renderer.step,"frames":renderer.rendered_frames,"peak":renderer.output_peak,"voices":renderer.mix_voices.size(),"track":renderer.track_id}
		worker_mutex.unlock()

func fill_buffer() -> void:
	worker_mutex.lock()
	worker_controls={"target":target,"overdrive":overdrive,"surge":surge,"gain":desired_gain,"track":pending_track,"deadline":context_deadline,"future":future_context,"origin":output_origin}
	var buffered=worker_buffers.size()
	var stats=worker_stats.duplicate()
	worker_mutex.unlock()
	if playback==null:
		if buffered<32: return # prime before opening the device; no startup underrun
		music_player.play();output_origin=Time.get_ticks_msec()
		playback=music_player.get_stream_playback()
	if not stats.is_empty():
		step=stats.step;rendered_frames=stats.frames;output_peak=stats.peak
		track_id=stats.track
		if pending_track==track_id: pending_track=""
	underruns=playback.get_skips()
	while playback.get_frames_available()>=512:
		worker_mutex.lock()
		var buffer=worker_buffers.pop_front() if not worker_buffers.is_empty() else null
		worker_mutex.unlock()
		if buffer==null: break
		playback.push_buffer(buffer)

func render_frames(count: int) -> PackedVector2Array:
	var output=PackedVector2Array()
	output.resize(count)
	var offset=0
	while offset<count:
		if context_frame>=0 and rendered_frames>=context_frame:
			desired_gain=1.0 if frame_context=="battle" else .7
			context_frame=-1
		if sample_remaining<=0:
			var beat=emit_step()
			sample_remaining=maxi(1,int(round(beat*SAMPLE_RATE/4.0)))
		var length=mini(count-offset,sample_remaining)
		if context_frame>rendered_frames: length=mini(length,context_frame-rendered_frames)
		for voice in mix_voices:
			var available=mini(length,voice.samples.size()-voice.position)
			for i in range(available):
				var value=voice.samples[voice.position+i]*voice.gain
				output[offset+i]+=Vector2(value,value)
			voice.position+=available
		mix_voices=mix_voices.filter(func(v): return v.position<v.samples.size())
		for i in range(length):
			context_gain=move_toward(context_gain,desired_gain,1.0/(SAMPLE_RATE*.16))
			var value=output[offset+i].x*context_gain
			# Gentle bounded saturation plus the Master limiter prevents overload.
			value=clampf(value/(1.0+absf(value)*.25),-.95,.95)
			output_peak=maxf(output_peak,absf(value))
			output[offset+i]=Vector2(value,value)
		offset+=length;sample_remaining-=length;rendered_frames+=length
	remaining=sample_remaining/float(SAMPLE_RATE)
	return output

func queue_music(stream: AudioStreamWAV, key: String, gain: float) -> void:
	if not pcm_cache.has(key):
		var samples=PackedFloat32Array()
		samples.resize(stream.data.size()/2)
		for i in range(samples.size()): samples[i]=stream.data.decode_s16(i*2)/32768.0
		if pcm_cache.size()>=256: pcm_cache.erase(pcm_cache.keys()[0])
		pcm_cache[key]=samples
	mix_voices.append({"samples":pcm_cache[key],"position":0,"gain":gain})

func update_pressure(grid: Array) -> void:
	var top = 12
	var occupied = 0
	for y in range(grid.size()):
		for value in grid[y]:
			if value:
				top = mini(top,y)
				occupied += 1
	var pressure = (12-top)/12.0*.7+occupied/72.0*.3
	target = clampf((pressure-.4)/.55,0,1)

func waveform(phase: float, kind: String) -> float:
	match kind:
		"square": return 1.0 if fmod(phase,TAU)<PI else -1.0
		"sawtooth": return fmod(phase/TAU,1.0)*2.0-1.0
		"triangle": return 1.0-4.0*absf(fmod(phase/TAU,1.0)-.5)
	return sin(phase)

func note(midi: float, duration: float, volume: float, kind: String = "triangle", musical: bool = true) -> void:
	if not musical and not sound_enabled:
		return
	var length = roundf(duration*20)/20.0
	var key = "%s:%d:%.2f" % [kind,int(midi),length]
	var stream: AudioStreamWAV
	if cache.has(key):
		stream = cache[key]
	else:
		var count = maxi(1,int(length*SAMPLE_RATE))
		var bytes = PackedByteArray()
		bytes.resize(count*2)
		var frequency = 440.0*pow(2.0,(midi-69.0)/12.0)
		var filtered = 0.0
		for n in range(count):
			var time = n/float(SAMPLE_RATE)
			var envelope = minf(1,time/.015)*pow(1.0-n/float(count),2)
			var sample = waveform(time*frequency*TAU,kind)
			filtered += .3*(sample-filtered)
			bytes.encode_s16(n*2,int(clampf(filtered*envelope,-1,1)*24000))
		stream = AudioStreamWAV.new()
		stream.format = AudioStreamWAV.FORMAT_16_BITS
		stream.mix_rate = SAMPLE_RATE
		stream.data = bytes
		if cache.size()>256:
			cache.erase(cache.keys()[0])
		cache[key] = stream
	if musical:
		queue_music(stream,key,volume)
		return
	if render_only: return
	if voices.size()>=24: return
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.bus="Music" if musical else "SFX"
	player.volume_db = linear_to_db(maxf(volume,.001))
	player.set_meta("music",musical)
	add_child(player)
	voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free())
	player.play()

func percussion(snare: bool, musical: bool = true) -> void:
	if not musical and not sound_enabled:
		return
	var key = "snare" if snare else "hat"
	var stream: AudioStreamWAV
	if cache.has(key):
		stream = cache[key]
	else:
		var count = int(SAMPLE_RATE*(.14 if snare else .035))
		var bytes = PackedByteArray()
		bytes.resize(count*2)
		var previous = 0.0
		for n in range(count):
			var noise = randf_range(-1,1)
			var high = noise-previous*.8
			previous = noise
			bytes.encode_s16(n*2,int(clampf(high*pow(1-n/float(count),3)*.4,-1,1)*16000))
		stream = AudioStreamWAV.new()
		stream.format = AudioStreamWAV.FORMAT_16_BITS
		stream.mix_rate = SAMPLE_RATE
		stream.data = bytes
		cache[key] = stream
	if musical:
		queue_music(stream,key,.08 if snare else .028)
		return
	if render_only: return
	if voices.size()>=24: return
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.bus="Music" if musical else "SFX"
	player.volume_db = -22 if snare else -31
	player.set_meta("music",musical)
	add_child(player)
	voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free())
	player.play()

func stinger(notes: Array, spacing: float, duration: float, volume: float, square: bool = false) -> void:
	if not sound_enabled: return
	for i in range(notes.size()):
		sfx_queue.append({"delay":i*spacing,"midi":notes[i],"duration":duration,"volume":volume,"kind":"square" if square and i%2==0 else "triangle"})
	if sfx_queue.size()>48: sfx_queue=sfx_queue.slice(-48)

func effect(kind: String, value: int = 1, count: int = 3) -> void:
	if not sound_enabled: return
	match kind:
		"move": note(78,.04,.10,"square",false)
		"swap": stinger([74,67],.032,.064,.14)
		"clear":
			var base=69+mini(value-1,6)*2
			stinger([base,base+4,base+7,base+12] if value>1 else ([base,base+4,base+7] if count>3 else [base,base+4]),.055,.13,.16,true)
		"garbage": percussion(true,false);stinger([45,33],.032,.16,.22);note(40,.08,.08,"square",false)
		"attack": stinger([76,64,52],.032,.064,.12,true)
		"pulse": stinger([76,81,88],.032,.064,.16,true);percussion(false,false)
		"shift": stinger([76,69,57],.032,.064,.18);percussion(false,false)
		"surge": stinger([69,73,76,81],.048,.096,.12,true)
		"overdrive": stinger([57,69,73,76,81,88],.032,.128,.16,true);percussion(true,false)
		"confirm": stinger([72,79,84],.032,.064,.14,true)
		"countdown": note(60+clampi(value,1,3)*4,.1,.18,"square",false)
		"go": stinger([72,76,79,84],.048,.096,.18,true)
		"win": stinger([72,76,79,84],.13,.18,.2)
		"lose": stinger([64,60,55,48],.13,.25,.18)

func _process(delta: float) -> void:
	for item in sfx_queue:
		item.delay-=delta
		if item.delay<=0 and sound_enabled: note(item.midi,item.duration,item.volume,item.kind,false)
	sfx_queue=sfx_queue.filter(func(item): return item.delay>0 and sound_enabled)
	if playing and not render_only: fill_buffer()

func emit_step() -> float:
	if step%16==0 and not pending_track.is_empty():
		track_id=pending_track;pending_track=""
	# Change harmony/tempo on subdivision boundaries, keeping phase continuous.
	if step%16==0: intensity=lerpf(intensity,clampf(target+(.08 if surge else 0),0,1),.6)
	var profile = tracks[track_id]
	var beat = 60.0/lerpf(profile.low,profile.high,intensity)
	var position = step%16
	var bar = int(step/16)
	if position==0:
		current_chord = profile["tense" if intensity>.65 else "calm"][bar%4]
		for tone in current_chord:
			note(tone,beat*maxf(4.1,float(profile.padLength)),.026,profile.pad)
	var degree = profile.melody[step%profile.melody.size()]
	if degree!=null:
		note(current_chord[int(degree)]+12,beat*.58,.1,profile.lead)
	var bass = profile.bass[position]
	if bass!=null:
		note(current_chord[int(bass)]-24,beat*.5,.18,"triangle")
	if position%int(profile.arpRate)==0 or intensity>.55:
		note(current_chord[(int(position/2)+bar)%5]+12,beat*.23,.05,profile.arp)
	if overdrive and position%2==0:
		note(current_chord[position%5]+24,beat*.3,.055,"sawtooth")
	if position==0 or position==8 or (track_id=="chrome" and position==6):
		note(30,.15,.28,"sine")
	if position==4 or position==12:
		percussion(true)
	if position%2==0 or (intensity>.75 and position%4==3):
		percussion(false)
	step += 1
	return beat

func shutdown() -> void:
	sfx_queue.clear()
	stop_music()
	if is_instance_valid(music_player): music_player.queue_free()
	primary_players=0
	pcm_cache.clear()
	playing = false
	sound_enabled = false
	music_enabled = false
	for player in voices:
		if is_instance_valid(player):
			player.stop()
			player.stream = null
			player.queue_free()
	voices.clear()
	cache.clear()

func _exit_tree() -> void:
	if worker!=null: stop_music()
