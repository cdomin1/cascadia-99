extends Node
const DSP=preload("res://scripts/audio_dsp.gd")
var config: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://assets/audio-config.json"))
var music
var tracks: Dictionary = {}
var track_id=""
var context="title"
var music_enabled=true:
	set(value):
		music_enabled=value
		if AudioServer.get_bus_index("Music")>=0: AudioServer.set_bus_mute(AudioServer.get_bus_index("Music"),not value)
var sound_enabled=true:
	set(value):
		sound_enabled=value
		if AudioServer.get_bus_index("SFX")>=0: AudioServer.set_bus_mute(AudioServer.get_bus_index("SFX"),not value)
var master_volume=.85:
	set(value):
		master_volume=clampf(value,0,1)
		AudioServer.set_bus_volume_db(0,linear_to_db(maxf(pow(master_volume,1.5),.000001)))
var music_volume=.75:
	set(value):
		music_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("Music")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),linear_to_db(maxf(pow(music_volume,1.5),.000001)))
var sfx_volume=.85:
	set(value):
		sfx_volume=clampf(value,0,1)
		if AudioServer.get_bus_index("SFX")>=0: AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),linear_to_db(maxf(pow(sfx_volume,1.5)*config.mix.sfxTrim,.000001)))
var voices: Array=[]
var cache: Dictionary={}
var sfx_queue: Array=[]
var played_effects=0
const SAMPLE_RATE=24000

func _ready() -> void:
	music=preload("res://scripts/music_player.gd").new();add_child(music);tracks=music.tracks
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
	# Catch combined music/SFX peaks while retaining the calibrated SFX mix.
	if AudioServer.get_bus_effect_count(0)==0:
		var limiter=AudioEffectHardLimiter.new()
		limiter.ceiling_db=-1
		limiter.release=.09
		AudioServer.add_bus_effect(0,limiter)
	master_volume=master_volume;music_volume=music_volume;sfx_volume=sfx_volume
	music_enabled=music_enabled;sound_enabled=sound_enabled

func select_track(id: String) -> void:
	if music.select_track(id): track_id=id
func set_context(value: String) -> void:
	context=value;music.set_context(value)
	if music_enabled: music.start_music()
func start_music() -> bool:
	return music.start_music() if music_enabled else false
func stop_music() -> void: music.stop_music()
func note(midi: float, duration: float, volume: float, kind: String = "reed") -> void:
	if not sound_enabled: return
	var key="%s:%d:%.4f" % [kind,int(midi),duration]
	var stream: AudioStreamWAV
	if cache.has(key): stream=cache[key]
	else:
		stream=AudioStreamWAV.new();stream.format=AudioStreamWAV.FORMAT_16_BITS;stream.mix_rate=SAMPLE_RATE
		stream.data=DSP.synthesize(midi,duration,kind,SAMPLE_RATE)
		if cache.size()>=512: cache.erase(cache.keys()[0])
		cache[key]=stream
	if voices.size()>=32: return
	var player=AudioStreamPlayer.new();player.stream=stream;player.bus="SFX"
	player.volume_db=linear_to_db(maxf(volume,.000001));player.set_meta("music",false)
	add_child(player);voices.append(player)
	player.finished.connect(func(): voices.erase(player);player.queue_free());player.play()

func effect(kind: String, value: int = 1, count: int = 3) -> void:
	if not sound_enabled: return
	var events: Array=config.sfx.get(kind,[])
	if kind=="countdown": events=[[0,[62,65,69][clampi(value,1,3)-1],.12,.32,"metal"]]
	if kind=="clear":
		events=[]
		var scale=[62,65,67,69,72,74,77,79]
		var base=clampi(value-1,0,6)
		for i in range(4 if value>1 else (3 if count>3 else 2)):
			events.append([i*.045,scale[mini(7,base+i)],.14,.34 if value>1 else .26,"bell" if i%2 else "metal"])
	if not events.is_empty(): played_effects+=1
	for event in events:
		sfx_queue.append({"delay":event[0],"midi":event[1],"duration":event[2],"volume":event[3],"kind":event[4]})
	if sfx_queue.size()>64: sfx_queue=sfx_queue.slice(-64)


func _process(delta: float) -> void:
	for item in sfx_queue:
		item.delay-=delta
		if item.delay<=0 and sound_enabled: note(item.midi,item.duration,item.volume,item.kind)
	sfx_queue=sfx_queue.filter(func(item): return item.delay>0 and sound_enabled)

func shutdown() -> void:
	sfx_queue.clear();music.shutdown()
	for player in voices:
		if is_instance_valid(player): player.stop();player.queue_free()
	voices.clear();cache.clear()
