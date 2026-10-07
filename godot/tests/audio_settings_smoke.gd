extends SceneTree
const Main=preload("res://scripts/main.gd")
const PATH="user://audio-migration-qa.cfg"
func _initialize() -> void: call_deferred("run")
func run() -> void:
	var old=ConfigFile.new();old.set_value("audio","music_volume",.25);old.set_value("audio","sfx_volume",0.0);old.set_value("audio","music",false);old.set_value("audio","sound",false);old.set_value("onboarding","choice","skip");old.save(PATH)
	var main=Main.new();main.settings_path=PATH;root.add_child(main)
	assert(is_equal_approx(main.audio.music_volume,pow(.25,1.0/1.5)))
	assert(main.audio.sfx_volume==0 and main.audio.master_volume==.85)
	assert(not main.audio.music_enabled and not main.audio.sound_enabled)
	var saved=main.audio.music_volume;main.audio.master_volume=0;main.save_preferences();main.queue_free();await process_frame
	main=Main.new();main.settings_path=PATH;root.add_child(main)
	assert(main.audio.master_volume==0 and main.audio.sfx_volume==0 and is_equal_approx(main.audio.music_volume,saved))
	print("NATIVE_AUDIO_SETTINGS_OK: low/zero migration, fresh defaults, mute retention, one-time marker and saved Master zero")
	main.audio.shutdown();main.queue_free();await process_frame;DirAccess.remove_absolute(ProjectSettings.globalize_path(PATH));quit(0)
