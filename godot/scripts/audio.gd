extends Node
const DSP=preload("res://scripts/audio_dsp.gd")
var score: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/audio-score.json"))

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
var master_volume = .85:
	set(value):
		master_volume=clampf(value,0,1)
		AudioServer.set_bus_volume_db(0,linear_to_db(maxf(pow(master_volume,1.5),.000001)))
var music_volume = .75:
	set(value):
		music_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("Music")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),linear_to_db(maxf(pow(music_volume,1.5)*score.mix.musicTrim,.000001)))
var sfx_volume = .85:
	set(value):
		sfx_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("SFX")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),linear_to_db(maxf(pow(sfx_volume,1.5)*score.mix.sfxTrim,.000001)))
var playing = false
var render_only = false
var target = 0.0
var intensity = 0.0
var overdrive = false
var surge = false
var arrangement_overdrive = false
var arrangement_surge = false
var context = "title"
var context_gain = 1.0
var desired_gain = 1.0
var pending_track = ""
var music_player: AudioStreamPlayer
var playback: AudioStreamGeneratorPlayback
var mix_voices: Array = []
var pcm_cache: Dictionary = {}
var sample_remaining = 0
var sample_remainder = 0.0
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
const SAMPLE_RATE = 24000

func _ready() -> void:
	tracks = score.tracks
	var effect_index=JSON.parse_string(FileAccess.get_file_as_string("res://assets/audio-sfx-index.json"))
	var effect_pcm=FileAccess.get_file_as_bytes("res://assets/audio-sfx.bin")
	for key in effect_index:
		var entry=effect_index[key]
		var stream=AudioStreamWAV.new();stream.format=AudioStreamWAV.FORMAT_16_BITS;stream.mix_rate=SAMPLE_RATE
		stream.data=effect_pcm.slice(int(entry.offset),int(entry.offset+entry.length));cache[key]=stream
	for bus in ["Music","SFX"]:
		if AudioServer.get_bus_index(bus)<0:
			AudioServer.add_bus();AudioServer.set_bus_name(AudioServer.bus_count-1,bus)
			AudioServer.set_bus_send(AudioServer.bus_count-1,"Master")
	# Catch combined music/SFX peaks without altering the compositions.
	if AudioServer.get_bus_effect_count(0)==0:
		var limiter=AudioEffectHardLimiter.new()
		limiter.ceiling_db=-1
		limiter.release=.09
		AudioServer.add_bus_effect(0,limiter)
	master_volume=master_volume;music_volume=music_volume;sfx_volume=sfx_volume
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
	desired_gain=score.mix.context.get(value,1.0)
	if value=="title": target=0;overdrive=false;surge=false
	start_music()

func start_music() -> void:
	if playing: return
	playing=true;starts+=1
	step=0;sample_remaining=0;sample_remainder=0;remaining=0;intensity=target
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
			desired_gain=score.mix.context.get(frame_context,1.0)
			context_frame=-1
		if sample_remaining<=0:
			var beat=emit_step()
			var exact=beat*SAMPLE_RATE/4.0+sample_remainder
			sample_remaining=maxi(1,int(floor(exact)))
			sample_remainder=exact-sample_remaining
		var length=mini(count-offset,sample_remaining)
		if context_frame>rendered_frames: length=mini(length,context_frame-rendered_frames)
		for voice in mix_voices:
			var available=mini(length,voice.samples.size()-voice.position)
			for i in range(available):
				var value=voice.samples[voice.position+i]*voice.gain
				output[offset+i]+=Vector2(value*cos((voice.pan+1)*PI/4),value*sin((voice.pan+1)*PI/4))
			voice.position+=available
		mix_voices=mix_voices.filter(func(v): return v.position<v.samples.size())
		for i in range(length):
			context_gain=move_toward(context_gain,desired_gain,1.0/(SAMPLE_RATE*.16))
			output[offset+i]*=context_gain
			output_peak=maxf(output_peak,maxf(absf(output[offset+i].x),absf(output[offset+i].y)))
		offset+=length;sample_remaining-=length;rendered_frames+=length
	remaining=sample_remaining/float(SAMPLE_RATE)
	return output

func queue_music(stream: AudioStreamWAV, key: String, gain: float, pan: float = 0.0) -> void:
	if not pcm_cache.has(key):
		var samples=PackedFloat32Array()
		samples.resize(stream.data.size()/2)
		for i in range(samples.size()): samples[i]=stream.data.decode_s16(i*2)/32768.0
		if pcm_cache.size()>=256: pcm_cache.erase(pcm_cache.keys()[0])
		pcm_cache[key]=samples
	mix_voices.append({"samples":pcm_cache[key],"position":0,"gain":gain,"pan":pan})

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

func note(midi: float, duration: float, volume: float, kind: String = "reed", musical: bool = true, pan: float = 0.0) -> void:
	if not musical and not sound_enabled: return
	var key="%s:%d:%.4f" % [kind,int(midi),duration]
	var stream: AudioStreamWAV
	if cache.has(key): stream=cache[key]
	else:
		stream=AudioStreamWAV.new();stream.format=AudioStreamWAV.FORMAT_16_BITS;stream.mix_rate=SAMPLE_RATE
		stream.data=DSP.synthesize(midi,duration,kind,SAMPLE_RATE)
		if cache.size()>=512: cache.erase(cache.keys()[0])
		cache[key]=stream
	if musical: queue_music(stream,key,volume,pan);return
	if render_only or voices.size()>=32: return
	var player=AudioStreamPlayer.new();player.stream=stream;player.bus="SFX"
	player.volume_db=linear_to_db(maxf(volume,.000001));player.set_meta("music",false)
	add_child(player);voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free());player.play()

func effect(kind: String, value: int = 1, count: int = 3) -> void:
	if not sound_enabled: return
	var events: Array=score.sfx.get(kind,[])
	if kind=="countdown": events=[[0,[62,65,69][clampi(value,1,3)-1],.12,.32,"metal"]]
	if kind=="clear":
		events=[]
		var scale=[62,65,67,69,72,74,77,79]
		var base=clampi(value-1,0,6)
		for i in range(4 if value>1 else (3 if count>3 else 2)):
			events.append([i*.045,scale[mini(7,base+i)],.14,.34 if value>1 else .26,"bell" if i%2 else "metal"])
	for event in events:
		sfx_queue.append({"delay":event[0],"midi":event[1],"duration":event[2],"volume":event[3],"kind":event[4]})
	if sfx_queue.size()>64: sfx_queue=sfx_queue.slice(-64)


func _process(delta: float) -> void:
	for item in sfx_queue:
		item.delay-=delta
		if item.delay<=0 and sound_enabled: note(item.midi,item.duration,item.volume,item.kind,false)
	sfx_queue=sfx_queue.filter(func(item): return item.delay>0 and sound_enabled)
	if playing and not render_only: fill_buffer()

func emit_step() -> float:
	if step%16==0:
		if not pending_track.is_empty(): track_id=pending_track;pending_track=""
		intensity=lerpf(intensity,clampf(target,0,1),.6)
		arrangement_overdrive=overdrive;arrangement_surge=surge
	var profile=tracks[track_id]
	var beat=60.0/profile.bpm
	var bar=int(step/16)%profile.bars.size()
	for event in profile.bars[bar]:
		if int(event[0])!=step%16: continue
		var level=DSP.layer_level(event[6],intensity,arrangement_overdrive,arrangement_surge)
		if level>0: note(event[1],event[2]*beat/4,event[3]*level,event[4],true,event[5])
	step+=1
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
