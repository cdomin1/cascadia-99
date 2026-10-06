extends Node

var tracks: Dictionary = {}
var track_id = "neon"
var music_enabled = true
var sound_enabled = true
var playing = false
var render_only = false
var target = 0.0
var intensity = 0.0
var step = 0
var remaining = 0.0
var voices: Array = []
var cache: Dictionary = {}
var current_chord: Array = []
const SAMPLE_RATE = 16000

func _ready() -> void:
	tracks = JSON.parse_string(FileAccess.get_file_as_string("res://assets/tracks.json"))

func select_track(id: String) -> void:
	if not tracks.has(id):
		return
	var resume = playing
	stop_music()
	track_id = id
	if resume:
		start_music()

func start_music() -> void:
	if playing: return
	if not music_enabled or not sound_enabled:
		return
	playing = true
	step = 0
	remaining = 0.0
	intensity = target

func stop_music() -> void:
	playing = false
	for player in voices:
		if is_instance_valid(player) and player.get_meta("music",false):
			player.stop()
			player.stream = null
			player.queue_free()
	voices = voices.filter(func(player): return is_instance_valid(player) and not player.is_queued_for_deletion())

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
	if not sound_enabled or (musical and not music_enabled):
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
	if render_only: return
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = linear_to_db(maxf(volume,.001))
	player.set_meta("music",musical)
	add_child(player)
	voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free())
	player.play()

func percussion(snare: bool) -> void:
	if not sound_enabled:
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
	if render_only: return
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = -22 if snare else -31
	player.set_meta("music",true)
	add_child(player)
	voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free())
	player.play()

func effect(kind: String, value: int = 0) -> void:
	match kind:
		"move": note(78,.04,.12,"square",false)
		"swap": note(66,.08,.16,"triangle",false)
		"clear": note(76+mini(value,8),.22,.2,"triangle",false)
		"garbage", "attack": note(35,.3,.22,"sawtooth",false)
		"countdown": note(60,.1,.18,"square",false)
		"win": note(84,.8,.2,"triangle",false)
		"lose": note(40,.7,.18,"sawtooth",false)

func _process(delta: float) -> void:
	if not playing or not music_enabled or not sound_enabled:
		return
	intensity = lerpf(intensity,target,minf(1,delta*1.4))
	remaining -= delta
	if remaining>0:
		return
	var profile = tracks[track_id]
	var beat = 60.0/lerpf(profile.low,profile.high,intensity)
	var position = step%16
	var bar = int(step/16)
	if position==0:
		current_chord = profile["tense" if intensity>.65 else "calm"][bar%4]
		for tone in current_chord:
			note(tone,beat*3.8,.026,profile.pad)
	var degree = profile.melody[step%profile.melody.size()]
	if degree!=null:
		note(current_chord[int(degree)]+12,beat*.58,.1,profile.lead)
	var bass = profile.bass[position]
	if bass!=null:
		note(current_chord[int(bass)]-24,beat*.5,.18,"triangle")
	if position%int(profile.arpRate)==0 or intensity>.55:
		note(current_chord[(int(position/2)+bar)%5]+12,beat*.23,.05,profile.arp)
	if position==0 or position==8 or (track_id=="chrome" and position==6):
		note(30,.15,.28,"sine")
	if position==4 or position==12:
		percussion(true)
	if position%2==0 or (intensity>.75 and position%4==3):
		percussion(false)
	step += 1
	remaining += beat/4

func shutdown() -> void:
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
