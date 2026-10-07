extends Control

const InputRouter = preload("res://scripts/input_router.gd")
var training_mode=false
var training_pending: Dictionary = {}
var training_status: Dictionary = {}
var training_label: Label
var offline_pid=-1
var offline_address=""

var input_router=InputRouter.new()
var prompt_nodes: Array = []
var focus_before_modal: Control
var controller_notice: Label

const BattleIntro = preload("res://scripts/battle_intro.gd")
var battle_intro
var preparing_match = ""
var cancel_notice = ""
const BattleTargeting = preload("res://scripts/battle_targeting.gd")
var battle_targeting
var attack_match = ""
var attack_sequence = 0
var visual_target = ""
var rival_scroll
var target_label
var incoming_label
const Network = preload("res://scripts/network.gd")
const BoardView = preload("res://scripts/board_view.gd")
const TutorialGallery = preload("res://scripts/tutorial_gallery.gd")
const FluxMeter = preload("res://scripts/flux_meter.gd")
const Synth = preload("res://scripts/audio.gd")
const MODE_IDS = ["battle","duel","quad","teams"]
const MODE_NAMES = ["BATTLE ROYALE","2P DUEL","4P FREE-FOR-ALL","2V2 TEAMS"]
const TRACK_IDS = ["neon","midnight","coast","chrome"]
const Neo = preload("res://scripts/neo_vector.gd")
var neo = Neo.specification()
var selected_mode=0
var hud_side: VBoxContainer
var flux_group: VBoxContainer
var targeting_controls: HBoxContainer
var tutorial_nav: HBoxContainer
var tutorial_next: Button
var network
var audio
var reduced_motion = false
var settings = ConfigFile.new()
var shell: VBoxContainer
var screen: Control
var screen_id = "title"
var status_label: Label
var message_label: Label
var modal: PanelContainer
var modal_body: VBoxContainer
var server_input: LineEdit
var name_input: LineEdit
var room_input: LineEdit
var mode_picker: OptionButton
var rules_picker: OptionButton
var cpu_picker: OptionButton
var difficulty_picker: OptionButton
var lobby: Dictionary = {}
var snapshot: Dictionary = {}
var room_code = ""
var host_id = ""
var active = false
var finished = false
var boosting = false
var move_repeat = 0.0
var own_board
var rival_views: Dictionary = {}
var rival_grid: GridContainer
var hud: Label
var game_notice: Label
var pulse_button: Button
var ability_buttons: Dictionary = {}
var flux_meter: ProgressBar
var flux_label: Label
var ability_timer: Label
var target_picker: OptionButton
var flux_config: Dictionary = {}
var screen_shake = "normal"
var flashing_effects = "full"
var effect_quality="full"
var countdown = -1
var last_input = "keyboard"
var qa_mode = false
var qa_clock = 0.0
var qa_stage = 0
var best_score = 0
var best_chain = 0
var wins = 0
var qa_gamepad_swap = false
var qa_cursor_start = 2
var settings_path = "user://settings.cfg"
var shutting_down = false

func _ready() -> void:
	qa_mode = OS.get_cmdline_user_args().has("--smoke-ui")
	if qa_mode:
		settings_path="user://qa-settings.cfg"
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../.web-smoke"))
	if settings.load(settings_path) == ERR_FILE_NOT_FOUND and not qa_mode:
		# Import the previous title's preferences and records on first launch.
		settings.load(OS.get_user_data_dir().get_base_dir().path_join("Cascadia 99/settings.cfg"))
	if settings.has_section_key("appearance","palette"): settings.erase_section_key("appearance","palette")
	if settings.has_section_key("appearance","light"): settings.erase_section_key("appearance","light")
	reduced_motion = settings.get_value("appearance","reduced_motion",false)
	screen_shake = settings.get_value("appearance","screen_shake","normal")
	flashing_effects = settings.get_value("appearance","flashing_effects","full")
	effect_quality=settings.get_value("appearance","effect_quality","full")
	best_score = settings.get_value("records","score",0)
	best_chain = settings.get_value("records","chain",0)
	wins = settings.get_value("records","wins",0)
	get_tree().auto_accept_quit = false
	get_window().close_requested.connect(exit_game)
	setup_actions()
	Input.joy_connection_changed.connect(controller_changed)
	network = Network.new()
	add_child(network)
	network.received.connect(receive)
	network.connection_changed.connect(connection_changed)
	audio = get_node("/root/MusicManager")
	audio.track_id = settings.get_value("audio","track","neon")
	if not TRACK_IDS.has(audio.track_id): audio.track_id = "neon"
	audio.music_enabled = settings.get_value("audio","music",true)
	audio.sound_enabled = settings.get_value("audio","sound",true)
	audio.music_volume=settings.get_value("audio","music_volume",.8)
	audio.sfx_volume=settings.get_value("audio","sfx_volume",.8)
	apply_theme()
	show_title()
	call_deferred("first_launch_prompt")
	var server_address=settings.get_value("network","server","http://127.0.0.1:3000")
	var arguments=OS.get_cmdline_user_args()
	for i in range(arguments.size()-1):
		if arguments[i]=="--server": server_address=arguments[i+1]
	network.connect_server(server_address)
	for arg in OS.get_cmdline_user_args():
		if arg=="--smoke-ui": qa_mode = true

func save_preferences() -> void:
	settings.set_value("appearance","reduced_motion",reduced_motion)
	settings.set_value("appearance","screen_shake",screen_shake)
	settings.set_value("appearance","flashing_effects",flashing_effects)
	settings.set_value("appearance","effect_quality",effect_quality)
	settings.set_value("audio","track",audio.track_id)
	settings.set_value("audio","music",audio.music_enabled)
	settings.set_value("audio","sound",audio.sound_enabled)
	settings.set_value("audio","music_volume",audio.music_volume)
	settings.set_value("audio","sfx_volume",audio.sfx_volume)
	settings.set_value("records","score",best_score)
	settings.set_value("records","chain",best_chain)
	settings.set_value("records","wins",wins)
	settings.save(settings_path)

func style(fill: Color, border: Color) -> StyleBoxFlat:
	var box = StyleBoxFlat.new()
	box.bg_color = fill
	box.border_color = border
	box.set_border_width_all(2)
	box.content_margin_left = 16
	box.content_margin_right = 16
	box.content_margin_top = 8
	box.content_margin_bottom = 8
	return box

func apply_theme() -> void:
	var colors = [neo.colors.background,neo.colors.surface,"#203346",neo.colors.neutral,neo.colors.muted,neo.colors.flux,neo.colors.target]
	var native_theme = Theme.new()
	native_theme.default_font = ThemeDB.fallback_font
	native_theme.default_font_size = 24
	native_theme.set_color("font_color","Label",Color(colors[3]))
	native_theme.set_color("font_color","Button",Color(colors[3]))
	native_theme.set_color("font_hover_color","Button",Color(colors[0]))
	native_theme.set_stylebox("normal","Button",style(Color.TRANSPARENT,Color.TRANSPARENT))
	native_theme.set_stylebox("disabled","Button",style(Color.TRANSPARENT,Color.TRANSPARENT))
	native_theme.set_stylebox("hover","Button",style(Color(colors[5]),Color(colors[5])))
	native_theme.set_stylebox("pressed","Button",style(Color(colors[6]),Color(colors[6])))
	native_theme.set_stylebox("focus","Button",style(Color.TRANSPARENT,Color(colors[5])))
	for widget in ["LineEdit","OptionButton","SpinBox"]:
		native_theme.set_stylebox("normal",widget,style(Color(colors[0]),Color(colors[2])))
		native_theme.set_color("font_color",widget,Color(colors[3]))
	native_theme.set_stylebox("panel","PanelContainer",style(Color(colors[0]),Color(colors[2])))
	native_theme.set_color("font_color","CheckBox",Color(colors[3]))
	theme = native_theme
	for view in rival_views.values():
		view.reduce_motion = reduced_motion
		view.fx.reduced_motion=reduced_motion
		view.fx.shake=screen_shake
		view.fx.flashing=flashing_effects
		view.fx.quality=effect_quality
		view.queue_redraw()
	if is_instance_valid(own_board):
		own_board.reduce_motion = reduced_motion
		own_board.fx.reduced_motion=reduced_motion
		own_board.fx.shake=screen_shake
		own_board.fx.flashing=flashing_effects
		own_board.fx.quality=effect_quality
		own_board.queue_redraw()
	if is_instance_valid(battle_intro):
		battle_intro.reduced_motion=reduced_motion
		battle_intro.flashing=flashing_effects
		battle_intro.shake=screen_shake
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO,size),Color(neo.colors.background))

func label(text: String, font_size: int = 24) -> Label:
	var node = Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size",font_size)
	return node

func button(text: String, callback: Callable) -> Button:
	var node = Button.new()
	node.text = text
	node.custom_minimum_size.y = 42
	node.pressed.connect(func():
		if text.begins_with("START"):
			audio.effect("confirm")
			node.disabled=true
			var original=node.modulate
			if flashing_effects=="full" and not reduced_motion:
				node.modulate=Color("#38FFFF")
				await get_tree().create_timer(.096).timeout
				if not is_instance_valid(node): return
				node.modulate=original
			node.disabled=false
		else: audio.effect("swap")
		callback.call())
	return node

func full_rect(node: Control) -> void:
	node.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func reset_screen(id: String) -> void:
	if is_instance_valid(battle_intro):
		remove_child(battle_intro);battle_intro.queue_free()
	battle_intro=null;preparing_match=""
	if is_instance_valid(battle_targeting): remove_child(battle_targeting);battle_targeting.queue_free()
	battle_targeting=null
	if is_instance_valid(screen):
		remove_child(screen)
		screen.queue_free()
	if is_instance_valid(modal): close_modal()
	screen_id = id
	screen = MarginContainer.new()
	add_child(screen)
	full_rect(screen)
	for side in ["left","right","top","bottom"]: screen.add_theme_constant_override("margin_"+side,24)
	shell = VBoxContainer.new()
	shell.add_theme_constant_override("separation",12)
	screen.add_child(shell)
	status_label = null
	message_label = null
	own_board = null
	rival_views.clear()

func show_title() -> void:
	training_mode=false
	if offline_pid>0:
		OS.kill(offline_pid);offline_pid=-1
		network.connect_server(settings.get_value("network","server","http://127.0.0.1:3000"))
	active = false
	finished = false
	audio.set_context("title")
	reset_screen("title")
	var center = CenterContainer.new()
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var title_scroll=ScrollContainer.new()
	title_scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL
	shell.add_child(title_scroll)
	center.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	title_scroll.add_child(center)
	var menu = VBoxContainer.new()
	menu.custom_minimum_size.x = minf(460,size.x-60)
	menu.add_theme_constant_override("separation",12)
	center.add_child(menu)
	var logo = TextureRect.new()
	logo.texture = load("res://assets/logo.svg")
	logo.modulate = Color.WHITE
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	logo.custom_minimum_size = Vector2(460,74)
	menu.add_child(logo)
	var subtitle = label("SWAP. CHAIN. SURVIVE.",22)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu.add_child(subtitle)
	menu.add_child(HSeparator.new())
	var first = button("PLAY",show_mode_menu)
	menu.add_child(first)
	menu.add_child(button("TUTORIAL",show_tutorial_menu))
	menu.add_child(button("FREE PRACTICE",show_practice_menu))
	menu.add_child(button("SETTINGS",show_options))
	menu.add_child(button("HOW TO PLAY",show_help))
	if not OS.has_feature("web"): menu.add_child(button("QUIT",exit_game))
	status_label=label("" if not network.player_id.is_empty() else "CONNECTING...",18)
	status_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	shell.add_child(status_label)
	call_deferred("safe_focus",first)

func open_modal(title: String) -> VBoxContainer:
	close_modal()
	focus_before_modal=get_viewport().gui_get_focus_owner()
	call_deferred("focus_modal")
	release_boost()
	modal = PanelContainer.new()
	add_child(modal)
	modal.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	modal.size = Vector2(minf(560,size.x-32),minf(680,size.y-32))
	modal.position = (size-modal.size)/2
	modal_body = VBoxContainer.new()
	modal_body.add_theme_constant_override("separation",10)
	var scroll=ScrollContainer.new()
	modal.add_child(scroll)
	modal_body.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	scroll.add_child(modal_body)
	modal_body.add_child(label(title,36))
	message_label = label("",20)
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	modal_body.add_child(message_label)
	return modal_body

func close_modal() -> void:
	if is_instance_valid(modal):
		remove_child(modal)
		modal.queue_free()
	modal = null
	if training_mode and training_status.get("paused",false): network.send_message({"type":"trainingControl","action":"pause"})
	if is_instance_valid(audio) and not active and screen_id=="title": audio.set_context("title")
	if active: get_viewport().gui_release_focus()
	input_router.reset()
	if is_instance_valid(focus_before_modal): call_deferred("safe_focus",focus_before_modal)
	if screen_id=="title" and is_instance_valid(screen):
		var buttons = screen.find_children("*","Button",true,false)
		if not buttons.is_empty(): call_deferred("safe_focus",buttons[0])

func field(container: VBoxContainer, text: String, node: Control) -> void:
	container.add_child(label(text,20))
	node.custom_minimum_size.y = 40
	container.add_child(node)

func picker(items: Array) -> OptionButton:
	var node = OptionButton.new()
	for item in items: node.add_item(str(item))
	return node

func player_field(body: VBoxContainer) -> void:
	name_input = LineEdit.new()
	name_input.max_length = 18
	name_input.text = settings.get_value("player","name","Player")
	field(body,"PLAYER NAME",name_input)

func show_mode_menu() -> void:
	var body=open_modal("PLAY")
	for index in range(MODE_IDS.size()):
		var choice=index
		body.add_child(button(MODE_NAMES[index],func(): selected_mode=choice;show_setup(true)))
	body.add_child(button("JOIN ONLINE ROOM",show_join))
	body.add_child(button("BACK",close_modal))

func show_pause() -> void:
	if training_mode: show_training_pause();return
	var body=open_modal("PAUSE")
	body.add_child(label("Online battle continues. Room "+room_code,18))
	body.add_child(button("RESUME",close_modal))
	body.add_child(button("SETTINGS",show_options))
	body.add_child(button("CONTROLS",show_help))
	body.add_child(button("LEAVE MATCH",func(): network.send_message({"type":"leave"})))

func cycle_strategy() -> void:
	var ids=["random","danger","attackers","badges"]
	var index=ids.find(snapshot.get("self",{}).get("targetMode","random"))
	network.send_message({"type":"target","id":null})
	network.send_message({"type":"mode","mode":ids[(index+1)%4]})

func show_setup(quick: bool) -> void:
	var body = open_modal(MODE_NAMES[selected_mode])
	player_field(body)
	if quick: name_input.visible=false;body.get_child(body.get_child_count()-2).visible=false
	mode_picker = picker(MODE_NAMES)
	mode_picker.select(selected_mode)
	mode_picker.visible=false
	body.add_child(mode_picker)
	rules_picker = picker(["CLASSIC","RUSH: +60% RISE"])
	field(body,"RULES",rules_picker)
	cpu_picker = picker(["1 CPU","3 CPUS","9 CPUS","24 CPUS","98 CPUS"])
	cpu_picker.select(2 if selected_mode==0 else (0 if selected_mode==1 else 1))
	cpu_picker.disabled=selected_mode!=0
	field(body,"CPU OPPONENTS",cpu_picker)
	difficulty_picker = picker(["EASY","NORMAL","HARD"])
	difficulty_picker.select(1)
	field(body,"CPU DIFFICULTY",difficulty_picker)
	mode_picker.item_selected.connect(func(index):
		cpu_picker.disabled = index!=0
		if index!=0: cpu_picker.select(0 if index==1 else 1))
	body.add_child(button("START BATTLE" if quick else "CREATE ROOM",func():
		if network.player_id.is_empty(): show_error("Connect to the server in Options first.");return
		var count = [1,3,9,24,98][cpu_picker.selected] if quick else 0
		settings.set_value("player","name",name_input.text)
		save_preferences()
		network.send_message({"type":"create","name":name_input.text,"mode":MODE_IDS[mode_picker.selected],"ruleset":"rush" if rules_picker.selected else "classic","bots":count,"difficulty":["easy","normal","hard"][difficulty_picker.selected],"quick":quick})))
	body.add_child(button("BACK",close_modal))
	body.add_child(button("ONLINE ROOM",func(): show_setup(false) if quick else show_join()))
	call_deferred("safe_focus",rules_picker)

func show_training_pause() -> void:
	if not training_status.get("paused",false): network.send_message({"type":"trainingControl","action":"pause"})
	var body=open_modal("PAUSE")
	body.add_child(button("RESUME",close_modal))
	body.add_child(button("RESTART LESSON" if training_status.get("mode")=="tutorial" else "RESTART",func(): close_modal();network.send_message({"type":"trainingControl","action":"restart"})))
	if training_status.get("mode")=="practice":
		body.add_child(button("PRACTICE SETTINGS",show_practice_menu))
		body.add_child(button("PRACTICE TOOLS",show_practice_tools))
	if training_status.get("mode")=="tutorial":
		if training_status.get("done",false): body.add_child(button("NEXT",func(): close_modal();network.send_message({"type":"trainingControl","action":"next"})))
		body.add_child(button("BACK",func(): close_modal();network.send_message({"type":"trainingControl","action":"back"})))
	body.add_child(button("SETTINGS",show_options))
	body.add_child(button("CONTROLS",show_help))
	body.add_child(button("EXIT",func(): close_modal();network.send_message({"type":"leave"})))

func show_practice_tools() -> void:
	var body=open_modal("PRACTICE TOOLS")
	for entry in [["COMBO","combo"],["CHAIN","chain"],["SIMULATE ATTACK","attack"]]:
		var action=entry[1]
		body.add_child(button(entry[0],func(): close_modal();network.send_message({"type":"trainingControl","action":action})))
	body.add_child(button("BACK",show_training_pause))

func refresh_training_hud() -> void:
	if not training_mode or not is_instance_valid(hud_side): return
	var tutorial=training_status.get("mode")=="tutorial"
	var lesson=int(training_status.get("lesson",0))
	hud.text="TUTORIAL %d / 7" % (lesson+1) if tutorial else "PRACTICE • RELAXED"
	if is_instance_valid(own_board): own_board.lesson_hint={"x":0 if lesson==3 and not "combo" in training_status.get("actions",[]) else 2,"y":11} if tutorial and lesson in [0,1,3,4] else {}
	flux_group.visible=not tutorial or lesson>=5
	targeting_controls.visible=tutorial and lesson==6
	target_label.visible=tutorial and lesson==6
	rival_scroll.visible=tutorial and lesson==6
	incoming_label.visible=(not tutorial or lesson>=4) and incoming_label.text!=""
	hud_side.visible=not tutorial or lesson>=4
	tutorial_nav.visible=tutorial
	tutorial_next.visible=training_status.get("done",false)
	if is_instance_valid(training_label):
		training_label.visible=tutorial
		training_label.text=str(training_status.get("title",""))+" — "+("NICE!" if training_status.get("done",false) else str(training_status.get("instruction","")))

func show_tutorial_menu() -> void:
	var body=open_modal("TUTORIAL")
	var lessons=picker(["1 MOVE & SWAP","2 MATCH THREE","3 RISING STACK","4 COMBOS & CHAINS","5 GLITCH BLOCKS","6 FLUX","7 BATTLE BASICS"])
	field(body,"CHOOSE A LESSON — UNLIMITED RETRIES",lessons)
	body.add_child(button("START TUTORIAL",func(): start_offline("tutorial",lessons.selected,{})))
	body.add_child(button("BACK",close_modal))

func show_practice_menu() -> void:
	var body=open_modal("RELAXED PRACTICE")
	var rising=picker(["OFF","SLOW","NORMAL","FAST"]);field(body,"STACK RISING",rising)
	var glitch=picker(["OFF","TRAINING BLOCKS"]);field(body,"GLITCH BLOCKS",glitch)
	var flux=picker(["NORMAL","UNLIMITED"]);field(body,"FLUX",flux)
	var game_over=CheckBox.new();game_over.text="GAME OVER ON";body.add_child(game_over)
	body.add_child(button("START PRACTICE",func(): start_offline("practice",0,{"rise":["off","slow","normal","fast"][rising.selected],"glitch":"training" if glitch.selected else "off","flux":"unlimited" if flux.selected else "normal","gameOver":game_over.button_pressed})))
	body.add_child(button("BACK",close_modal))

func start_offline(mode: String, lesson: int, options: Dictionary) -> void:
	settings.set_value("onboarding","choice","tutorial" if mode=="tutorial" else "skip");save_preferences()
	var script=ProjectSettings.globalize_path("res://../training-server.mjs")
	if not FileAccess.file_exists(script): show_error("Offline source bridge is unavailable in this export.");return
	if offline_pid>0: OS.kill(offline_pid)
	offline_address=ProjectSettings.globalize_path("user://offline-"+str(Time.get_ticks_usec())+".txt")
	var request={"type":"trainingStart","mode":mode,"lesson":lesson,"options":options}
	offline_pid=OS.create_process("node",[script,"--address-file",offline_address],false)
	if offline_pid<0: training_pending={};show_error("Offline practice requires Node.js 22+ in this source build.");return
	var deadline=Time.get_ticks_msec()+5000
	while not FileAccess.file_exists(offline_address) and Time.get_ticks_msec()<deadline: await get_tree().create_timer(.05).timeout
	if not FileAccess.file_exists(offline_address): training_pending={};OS.kill(offline_pid);offline_pid=-1;show_error("Offline engine did not start. Check Node.js 22+.");return
	var address=FileAccess.get_file_as_string(offline_address).strip_edges()
	DirAccess.remove_absolute(offline_address)
	close_modal();network.send_message({"type":"leave"});network.connect_server(address);training_pending=request

func first_launch_prompt() -> void:
	if qa_mode or settings.has_section_key("onboarding","choice"): return
	var body=open_modal("NEW TO VEXELON?")
	body.add_child(label("Learn how to play!",28))
	body.add_child(button("START TUTORIAL",show_tutorial_menu))
	body.add_child(button("SKIP FOR NOW",func(): settings.set_value("onboarding","choice","skip");save_preferences();close_modal()))

func show_join() -> void:
	var body = open_modal("JOIN A ROOM")
	player_field(body)
	room_input = LineEdit.new()
	room_input.max_length = 6
	room_input.placeholder_text = "A1B2C3"
	field(body,"SIX-CHARACTER ROOM CODE",room_input)
	var code_digits=HBoxContainer.new();body.add_child(code_digits)
	var digits: Array = []
	for n in range(6):
		var digit=picker(["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"])
		code_digits.add_child(digit);digits.append(digit)
		digit.item_selected.connect(func(_index):
			var code=""
			for item in digits: code+=item.get_item_text(item.selected)
			room_input.text=code)
	body.add_child(label("Controller: choose the six code digits above.",18))
	body.add_child(label("Use the same server as your friends.\nChange the server address in Options.",22))
	body.add_child(button("JOIN ROOM",func(): network.send_message({"type":"join","name":name_input.text,"code":room_input.text.strip_edges().to_upper()})))
	body.add_child(button("BACK",close_modal))
	room_input.grab_focus()

func show_options() -> void:
	if training_mode and not training_status.get("paused",false): network.send_message({"type":"trainingControl","action":"pause"})
	var body = open_modal("SETTINGS")
	body.add_child(label("AUDIO",20))
	var track_picker = picker(TRACK_IDS.map(func(id): return audio.tracks[id].name))
	track_picker.select(TRACK_IDS.find(audio.track_id))
	field(body,"SOUNDTRACK",track_picker)
	track_picker.item_selected.connect(func(index): audio.select_track(TRACK_IDS[index]);save_preferences())
	var choices = GridContainer.new()
	choices.columns=2
	body.add_child(choices)
	for entry in [["MUSIC",audio.music_enabled],["SOUND",audio.sound_enabled],["LESS MOTION",reduced_motion]]:
		var check = CheckBox.new()
		check.text = entry[0]
		check.button_pressed = entry[1]
		check.add_theme_font_size_override("font_size",20)
		choices.add_child(check)
		var kind = entry[0]
		check.toggled.connect(func(value):
			match kind:
				"MUSIC": audio.music_enabled=value
				"SOUND": audio.sound_enabled=value
				"LESS MOTION": reduced_motion=value

			apply_theme();save_preferences())
	for bus_kind in ["music","sfx"]:
		var volume_kind=bus_kind
		var slider=HSlider.new()
		slider.min_value=0;slider.max_value=100;slider.step=1
		slider.value=(audio.music_volume if volume_kind=="music" else audio.sfx_volume)*100
		field(body,("MUSIC" if volume_kind=="music" else "SFX")+" VOLUME",slider)
		slider.value_changed.connect(func(value):
			if volume_kind=="music": audio.music_volume=value/100.0
			else: audio.sfx_volume=value/100.0
			save_preferences())
	body.add_child(label("ACCESSIBILITY",20))
	var shake_picker = picker(["OFF","REDUCED","NORMAL","MAXIMUM"])
	shake_picker.select(["off","reduced","normal","maximum"].find(screen_shake))
	field(body,"SCREEN SHAKE",shake_picker)
	shake_picker.item_selected.connect(func(index): screen_shake=["off","reduced","normal","maximum"][index];apply_theme();save_preferences())
	var quality_picker=picker(["MINIMAL","REDUCED","FULL"])
	quality_picker.select(["minimal","reduced","full"].find(effect_quality))
	field(body,"EFFECT QUALITY",quality_picker)
	quality_picker.item_selected.connect(func(index): effect_quality=["minimal","reduced","full"][index];apply_theme();save_preferences())
	var flash_picker = picker(["REDUCED","FULL"])
	flash_picker.select(0 if flashing_effects=="reduced" else 1)
	field(body,"FLASHING EFFECTS",flash_picker)
	flash_picker.item_selected.connect(func(index): flashing_effects="reduced" if index==0 else "full";apply_theme();save_preferences())
	server_input = LineEdit.new()
	server_input.text = settings.get_value("network","server","http://127.0.0.1:3000")
	field(body,"GAME SERVER ADDRESS",server_input)
	body.add_child(button("CONNECT TO SERVER",func():
		settings.set_value("network","server",server_input.text);save_preferences()
		network.send_message({"type":"leave"});network.connect_server(server_input.text);audio.set_context("title");active=false
		close_modal();show_title()))
	if not active:
		body.add_child(button("PREVIEW / STOP MUSIC",func():
			audio.music_enabled=not audio.music_enabled;save_preferences()))
	else:
		body.add_child(label("Online matches continue while Options is open.",20))
	body.add_child(button("BACK",func():
		if not active: audio.set_context("title")
		close_modal()))
	body.add_child(button("CONTROLS",show_help))
	call_deferred("safe_focus",track_picker)

func show_help() -> void:
	var body = open_modal("HOW TO PLAY")
	message_label.free()
	message_label = null
	var scroller=ScrollContainer.new()
	scroller.name="TutorialScroll"
	scroller.custom_minimum_size=Vector2(0,430)
	scroller.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(scroller)
	var content=VBoxContainer.new()
	content.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation",12)
	scroller.add_child(content)
	var tutorials=TutorialGallery.new()
	tutorials.reduced_effects=reduced_motion or flashing_effects=="reduced"
	content.add_child(tutorials)
	var text = label("Match 3 matching shapes in a row or column.\nSwap neighbors; falling matches create chains.\nBig combos and chains send Glitch Blocks to rivals.\nClear next to a slab to break it into new tiles.\nEarn Flux with matches, combos, and chains.\nPulse 35: cancel a row or rescue your teammate.\nShift 60: lower a stable board. Surge 75: boost attacks for 8s.\nOverdrive 100: hold full Flux 3s, boost for 10s.\nStay below the ceiling. Last player or team wins.\n\nKEYBOARD\nArrows: move   Space: swap   Shift: raise   X: Pulse   C: Shift   V: Surge   B: Overdrive\nClick the board: position cursor. Right-click: swap.\n\nGAMEPAD\nD-pad / left stick: move   A / Cross: swap\nRB / R1: raise   X / Square: Pulse\nY / Triangle: Shift   LB / L1: Surge\nLeft trigger: Overdrive\nStart: Options   B / Circle: back",22)
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(text)
	var back=button("BACK",close_modal)
	body.add_child(back)
	call_deferred("safe_focus",back)

func show_error(text: String) -> void:
	if is_instance_valid(message_label): message_label.text = text
	if is_instance_valid(status_label): status_label.text = text
	if is_instance_valid(game_notice): game_notice.text = text

func connection_changed(connected: bool, detail: String) -> void:
	if is_instance_valid(status_label): status_label.text = "" if connected else detail
	if not connected and not network.connecting:
		release_boost();active=false
		show_error(detail)

func show_lobby(message: Dictionary) -> void:
	active = false
	finished = false
	audio.set_context("title")
	lobby = message
	room_code = message.room
	host_id = message.host
	reset_screen("lobby")
	shell.add_child(label("ROOM "+room_code+"    /    "+MODE_NAMES[MODE_IDS.find(message.mode)],42))
	var note = label("Share this code and server address with your friends. Browser clients can join too.",24)
	shell.add_child(note)
	var list = VBoxContainer.new()
	var scroll = ScrollContainer.new()
	rival_scroll=scroll
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	shell.add_child(scroll)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(list)
	for player in message.players:
		var row = HBoxContainer.new()
		list.add_child(row)
		var title = label(str(player.name)+(" [CPU]" if player.get("bot",false) else "")+(" [YOU]" if player.id==network.player_id else ""),28)
		title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(title)
		if message.mode=="teams":
			var team = picker(["CYAN TEAM","CORAL TEAM"])
			team.select(0 if player.get("team")=="a" else 1)
			team.disabled = host_id!=network.player_id and player.id!=network.player_id
			var player_id = player.id
			team.item_selected.connect(func(index): network.send_message({"type":"team","id":player_id,"team":"a" if index==0 else "b"}))
			row.add_child(team)
	message_label = label("",22)
	shell.add_child(message_label)
	var controls = HBoxContainer.new()
	shell.add_child(controls)
	if host_id==network.player_id:
		var count = SpinBox.new()
		count.min_value = 0
		count.max_value = message.capacity-message.players.filter(func(p): return not p.get("bot",false)).size()
		count.value = message.botCount
		controls.add_child(label("CPUS",22));controls.add_child(count)
		var difficulty = picker(["EASY","NORMAL","HARD"])
		difficulty.select(["easy","normal","hard"].find(message.difficulty))
		controls.add_child(difficulty)
		controls.add_child(button("UPDATE CPUS",func(): network.send_message({"type":"bots","count":int(count.value),"difficulty":["easy","normal","hard"][difficulty.selected]})))
		controls.add_child(button("START",func(): network.send_message({"type":"start"})))
	controls.add_child(button("COPY CODE",func(): DisplayServer.clipboard_set(room_code)))
	controls.add_child(button("LEAVE",func(): network.send_message({"type":"leave"})))
	var focus = controls.find_children("*","Button",true,false)
	if not focus.is_empty(): focus[0].grab_focus()

func show_arena(message: Dictionary) -> void:
	training_mode=message.get("training",false)
	active = true
	finished = false
	countdown = -1
	snapshot={}
	reset_screen("arena")
	var top = HBoxContainer.new()
	shell.add_child(top)
	hud = label("GET READY",20)
	hud.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(hud)
	top.add_child(button("PAUSE",show_pause))
	var arena = HBoxContainer.new()
	arena.add_theme_constant_override("separation",24)
	arena.size_flags_vertical = Control.SIZE_EXPAND_FILL
	shell.add_child(arena)
	var board_fit = AspectRatioContainer.new()
	board_fit.ratio = .5
	board_fit.stretch_mode = AspectRatioContainer.STRETCH_FIT
	board_fit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	arena.add_child(board_fit)
	own_board = BoardView.new()
	own_board.reduce_motion = reduced_motion
	own_board.fx.shake=screen_shake
	own_board.fx.flashing=flashing_effects
	own_board.fx.quality=effect_quality
	board_fit.add_child(own_board)
	own_board.selected.connect(board_clicked)
	own_board.landed.connect(func(_block): audio.effect("garbage"))
	var side = VBoxContainer.new()
	hud_side=side
	side.custom_minimum_size.x = minf(440 if message.total==2 and not training_mode else 280,size.x*.36)
	arena.add_child(side)
	game_notice = label("",20)
	game_notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	side.add_child(game_notice)
	flux_group=VBoxContainer.new()
	side.add_child(flux_group)
	flux_label=label("FLUX 0 / 100",20)
	flux_label.modulate=Color("#00E5FF")
	flux_group.add_child(flux_label)
	flux_meter=FluxMeter.new()
	flux_meter.max_value=flux_config.get("max",100)
	flux_meter.show_percentage=false
	flux_meter.custom_minimum_size.y=14
	flux_meter.add_theme_stylebox_override("background",style(Color("#06171C"),Color("#008DA6")))
	flux_meter.add_theme_stylebox_override("fill",style(Color("#00E5FF"),Color("#00E5FF")))
	flux_group.add_child(flux_meter)
	ability_timer=label("",18)
	flux_group.add_child(ability_timer)
	incoming_label=label("",20)
	incoming_label.modulate=Color(neo.colors.incoming)
	side.add_child(incoming_label)
	target_label=label("TARGET AUTO",18)
	target_label.visible=message.mode=="battle"
	target_label.modulate=Color(neo.colors.target)
	side.add_child(target_label)
	var ability_grid=GridContainer.new()
	ability_grid.columns=2
	flux_group.add_child(ability_grid)
	ability_buttons.clear()
	for kind in ["pulse","shift","surge","overdrive"]:
		var ability=kind
		var action_button=button(kind.to_upper(),func(): network.send_ability(ability))
		action_button.add_theme_font_size_override("font_size",16)
		action_button.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		action_button.disabled=true
		ability_grid.add_child(action_button)
		ability_buttons[kind]=action_button
	pulse_button=ability_buttons.pulse
	targeting_controls=HBoxContainer.new()
	side.add_child(targeting_controls)
	targeting_controls.add_child(button("‹",func(): cycle_target(-1)))
	targeting_controls.add_child(button("›",func(): cycle_target(1)))
	targeting_controls.add_child(button("RANDOM",cycle_strategy))
	var scroll = ScrollContainer.new()
	rival_scroll=scroll
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	side.add_child(scroll)
	rival_grid = GridContainer.new()
	rival_grid.columns = 3 if message.total<=4 else 5
	rival_grid.add_theme_constant_override("h_separation",8)
	rival_grid.add_theme_constant_override("v_separation",8)
	scroll.add_child(rival_grid)
	training_label=label("",20)
	training_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	training_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	shell.move_child(arena,shell.get_child_count()-1)
	shell.add_child(training_label)
	shell.move_child(training_label,1)
	tutorial_nav=HBoxContainer.new()
	tutorial_nav.alignment=BoxContainer.ALIGNMENT_CENTER
	shell.add_child(tutorial_nav)
	for entry in [["BACK","back"],["RESTART LESSON","restart"],["SKIP / EXIT","exit"],["NEXT","next"]]:
		var action=entry[1]
		var control=button(entry[0],func(): network.send_message({"type":"leave"}) if action=="exit" else network.send_message({"type":"trainingControl","action":action}))
		tutorial_nav.add_child(control)
		if action=="next": tutorial_next=control
	training_label.visible=training_mode
	tutorial_nav.visible=training_mode
	refresh_training_hud()
	audio.target = 0
	audio.set_context("intro")
	battle_intro=BattleIntro.new()
	battle_intro.reduced_motion=reduced_motion
	battle_intro.flashing=flashing_effects
	battle_intro.shake=screen_shake
	add_child(battle_intro)
	battle_intro.cue.connect(func(kind,value):
		audio.effect(kind,value)
		if kind=="go": audio.set_context("battle"))
	battle_intro.begin(message,own_board,network.server_time)
	if message.get("startAt")!=null: audio.schedule_context("battle",(float(message.startAt)-network.server_time())/1000.0)
	if message.get("phase")=="active": audio.set_context("battle")
	battle_targeting=BattleTargeting.new()
	add_child(battle_targeting)
	battle_targeting.begin(str(message.matchId),network.player_id,own_board,rival_views,message.mode=="battle")
	if attack_match==str(message.matchId): battle_targeting.last_sequence=attack_sequence
	else: attack_match=str(message.matchId);attack_sequence=0
	visual_target=""
	battle_targeting.reduced_motion=reduced_motion;battle_targeting.flashing=flashing_effects
	get_viewport().gui_release_focus()

func acknowledge_board(match_id: String) -> void:
	# Ready only after the first real snapshot has populated the board and layout.
	await get_tree().process_frame
	if screen_id=="arena" and is_instance_valid(battle_intro) and battle_intro.match_id==match_id:
		network.send_message({"type":"ready","matchId":match_id})

func board_clicked() -> void:
	get_viewport().gui_release_focus()
	if not active or snapshot.is_empty() or not is_instance_valid(battle_intro) or not battle_intro.can_play(): return
	var cell = minf(own_board.size.x/6.0,own_board.size.y/12.0)
	var point = own_board.get_local_mouse_position()-Vector2((own_board.size.x-cell*6)/2,0)
	var cx = clampi(int(point.x/cell),0,4)
	var cy = clampi(int(point.y/cell+own_board.rise),0,11)
	var selected = snapshot.self.cursor
	for n in range(absi(cx-int(selected.x))): network.send_message({"type":"move","dx":signi(cx-int(selected.x)),"dy":0})
	for n in range(absi(cy-int(selected.y))): network.send_message({"type":"move","dx":0,"dy":signi(cy-int(selected.y))})

func update_snapshot(message: Dictionary) -> void:
	snapshot = message
	if is_instance_valid(battle_intro): battle_intro.schedule(message)
	if screen_id!="arena": return
	var own = message.self
	var pending=0
	for packet in own.get("incoming",[]): pending+=int(packet.amount)
	incoming_label.text="GLITCH INCOMING! %d" % pending if pending>0 else ""
	incoming_label.visible=pending>0
	if is_instance_valid(targeting_controls): targeting_controls.get_child(2).text={"random":"RANDOM","danger":"NEAR TOP","attackers":"ATTACKERS","badges":"MOST KOs"}.get(own.get("targetMode","random"),"RANDOM")
	hud.text = "ALIVE %d   SCORE %d   KOS %d   %02d:%02d" % [message.remaining,own.score,own.kos,int(message.elapsed/60),int(message.elapsed)%60]
	flux_label.text="FLUX FULL!" if own.get("flux",0)>=flux_config.get("max",100) else "FLUX %d / %d" % [own.get("flux",0),flux_config.get("max",100)]
	var keys={"pulse":"WEST FACE","shift":"NORTH FACE","surge":"LB","overdrive":"LT"} if last_input=="gamepad" else {"pulse":"X","shift":"C","surge":"V","overdrive":"B"}
	for kind in ability_buttons:
		ability_buttons[kind].text="%s %d / %s" % [kind.to_upper(),flux_config.get(kind,{}).get("cost",0),keys[kind]]
		ability_buttons[kind].disabled=not own.get("abilities",{}).get(kind,false) or message.countdown>0 or finished
	var effect=own.get("activeAbility")
	ability_timer.text=("%s %.1fs" % [str(effect).to_upper(),own.abilityRemaining]) if effect!=null else (("OVERDRIVE %.1fs" % maxf(0,flux_config.get("overdrive",{}).get("hold",3)-own.get("maxFluxHeld",0))) if own.get("flux",0)>=flux_config.get("max",100) else "")
	ability_timer.visible=not ability_timer.text.is_empty()
	audio.overdrive=effect=="overdrive"
	audio.surge=effect=="surge"
	var self_player = {}
	for player in message.players:
		if player.id==network.player_id: self_player = player
	if self_player.is_empty(): return
	own_board.update_board(self_player,own)
	if not training_mode:
		best_score = maxi(best_score,int(own.score))
		best_chain = maxi(best_chain,int(own.get("bestChain",0)))
	if not self_player.dead: audio.update_pressure(self_player.grid)
	if not finished and not self_player.dead:
		game_notice.text = "" if message.countdown>0 else ("CRITICAL! CLEAR THE TOP" if own.danger>=1 else ("DANGER! CLEAR THE TOP" if own.danger>0 else ""))
	game_notice.visible=not game_notice.text.is_empty()
	game_notice.modulate=Color(neo.colors.critical if own.danger>=1 else neo.colors.danger)
	countdown=int(message.countdown)
	if message.get("phase")=="preparing" and preparing_match!=str(message.matchId):
		preparing_match=str(message.matchId)
		acknowledge_board(preparing_match)
	for player in message.players:
		if player.id==network.player_id: continue
		if not rival_views.has(player.id):
			var stack = VBoxContainer.new()
			rival_grid.add_child(stack)
			var view = BoardView.new()
			view.custom_minimum_size = Vector2(minf(280,rival_scroll.size.x-12),minf(560,rival_scroll.size.y-30)) if message.players.size()==2 else (Vector2(110,220) if message.players.size()<=4 else Vector2(24,48))
			view.reduce_motion = reduced_motion
			view.fx.shake=screen_shake
			view.fx.flashing=flashing_effects
			view.fx.quality=effect_quality
			view.miniature = message.mode=="battle"
			stack.add_child(view)
			var ally = lobby.get("mode")=="teams" and player.get("team")==self_player.get("team")
			var name_label = label(str(player.name)+(" / ALLY" if ally else ""),18)
			if message.mode!="battle": stack.add_child(name_label)
			else: name_label.free()
			var rival_id = player.id
			view.selected.connect(func():
				if not ally: network.send_message({"type":"target","id":rival_id});game_notice.text="TARGET: "+str(player.name))
			rival_views[player.id] = view
		rival_views[player.id].update_board(player)
		rival_views[player.id].player_number=int(player.get("number",0)) if message.mode=="battle" else 0
		rival_views[player.id].targeted=message.mode=="battle" and player.id==own.get("attackTarget")
		if rival_views[player.id].targeted:
			target_label.text="TARGET #%02d / %s" % [player.get("number",0),player.name]
			if visual_target!=player.id:
				visual_target=player.id
				rival_scroll.call_deferred("ensure_control_visible",rival_views[player.id])
	if message.mode=="battle" and own.get("attackTarget")==null: target_label.text="TARGET AUTO"
	refresh_training_hud()
	fit_battle_rivals()

func fit_battle_rivals() -> void:
	if snapshot.get("mode")!="battle" or not is_instance_valid(rival_scroll) or rival_views.is_empty(): return
	var count=rival_views.size()
	var width=maxf(48,rival_scroll.size.x-12);var height=maxf(48,rival_scroll.size.y-8)
	var columns=clampi(int(ceil(sqrt(count*2.0*width/height))),1,20)
	var rows=int(ceil(count/float(columns)))
	rival_grid.columns=columns
	rival_grid.add_theme_constant_override("h_separation",2);rival_grid.add_theme_constant_override("v_separation",2)
	var cell=minf((width-(columns-1)*2)/columns,(height-(rows-1)*2)/rows/2.0)
	for view in rival_views.values(): view.custom_minimum_size=Vector2(maxf(12,floorf(cell)),maxf(24,floorf(cell)*2))


func receive(message: Dictionary) -> void:
	if shutting_down: return
	if is_instance_valid(own_board): own_board.handle_event(message)
	if is_instance_valid(battle_targeting) and battle_targeting.confirm(message):
		attack_sequence=battle_targeting.last_sequence
		if message.type=="attack": incoming_label.text="GLITCH INCOMING! %d / %s" % [message.amount,message.from]
	match message.get("type",""):
		"resumed": room_code=message.room;host_id=message.host
		"resumeRejected": snapshot={};show_title();show_error("Session expired. Join a new room.")
		"hello":
			flux_config=message.get("fluxConfig",{})
			if not training_pending.is_empty():
				network.send_message(training_pending);training_pending={}
		"trainingVictory": audio.effect("win")
		"tutorialSuccess":
			audio.effect("clear")
			if is_instance_valid(own_board): own_board.fx.trigger("pulse")
		"trainingStatus":
			var just_completed=message.get("done",false) and not training_status.get("done",false)
			training_status=message
			refresh_training_hud()
			if just_completed and last_input=="gamepad": show_training_pause()
		"abilityRejected": show_error("Ability unavailable: check Flux, stable board, and active effects.")
		"ability":
			audio.effect(str(message.ability))
			if is_instance_valid(own_board): own_board.add_effect(str(message.ability).to_upper()+"!")
		"error": show_error(message.get("message","Server error"))
		"left": release_boost();save_preferences();snapshot={};show_title()
		"lobby":
			show_lobby(message)
			if not cancel_notice.is_empty(): show_error(cancel_notice);cancel_notice=""
		"start":
			if not message.has("matchId"): show_error("Server needs updating for synchronized starts.");return
			if not is_instance_valid(battle_intro) or battle_intro.match_id!=str(message.matchId) or message.get("resumed",false): show_arena(message)
		"startScheduled":
			audio.schedule_context("battle",(float(message.startAt)-network.server_time())/1000.0)
			if is_instance_valid(battle_intro): battle_intro.schedule(message)
		"startCancelled":
			active=false;release_boost();audio.set_context("title");snapshot={}
			cancel_notice=message.message
		"state": update_snapshot(message)
		"host": host_id=message.host
		"move", "swap", "attack":
			audio.effect(message.type)
			if message.type=="swap": qa_gamepad_swap=true
		"effect":
			audio.effect("clear",int(message.chain),int(message.count))
			if is_instance_valid(own_board): own_board.add_effect("CHAIN X%d" % message.chain if message.chain>1 else ("%d COMBO!" % message.count if message.count>3 else "+%d" % (message.count*10)))
		"break":
			audio.effect("clear")
			if is_instance_valid(own_board): own_board.add_effect("GLITCH BREAK!")
		"pulse":
			audio.effect("pulse")
			if is_instance_valid(own_board): own_board.add_effect("TEAM RESCUE!" if message.get("assist",false) else "PULSE!")
		"eliminated": audio.set_context("defeat");active=false;game_notice.text="ELIMINATED #%d / WATCH THE FIELD" % message.place;audio.effect("lose")
		"finished":
			active=false;finished=true;release_boost();audio.set_context("victory" if message.get("won",false) else "defeat")
			if message.get("won",false): wins+=1;audio.effect("win")
			else: audio.effect("lose")
			save_preferences()
			var body = open_modal("VICTORY!" if message.get("won",false) else "MATCH OVER")
			body.add_child(label(str(message.winner)+" wins!",28))
			if message.host==network.player_id: body.add_child(button("REMATCH",func(): network.send_message({"type":"rematch"})))
			body.add_child(button("TITLE SCREEN",func(): network.send_message({"type":"leave"})))
			var buttons = body.find_children("*","Button",true,false)
			if not buttons.is_empty(): buttons[0].grab_focus()

func setup_actions() -> void:
	# Explicit UI bindings: engine defaults vary by version and platform.
	for entry in [["ui_accept",JOY_BUTTON_A],["ui_cancel",JOY_BUTTON_B],["ui_left",JOY_BUTTON_DPAD_LEFT],["ui_right",JOY_BUTTON_DPAD_RIGHT],["ui_up",JOY_BUTTON_DPAD_UP],["ui_down",JOY_BUTTON_DPAD_DOWN]]:
		var event = InputEventJoypadButton.new()
		event.device = -1
		event.button_index = entry[1]
		if not InputMap.action_has_event(entry[0],event): InputMap.action_add_event(entry[0],event)
	var bindings = {"game_left":[KEY_LEFT,JOY_BUTTON_DPAD_LEFT],"game_right":[KEY_RIGHT,JOY_BUTTON_DPAD_RIGHT],"game_up":[KEY_UP,JOY_BUTTON_DPAD_UP],"game_down":[KEY_DOWN,JOY_BUTTON_DPAD_DOWN],"game_swap":[KEY_SPACE,JOY_BUTTON_A],"game_raise":[KEY_SHIFT,JOY_BUTTON_RIGHT_SHOULDER],"game_pulse":[KEY_X,JOY_BUTTON_X],"game_shift":[KEY_C,JOY_BUTTON_Y],"game_surge":[KEY_V,JOY_BUTTON_LEFT_SHOULDER],"game_overdrive":[KEY_B,-1],"target_strategy":[KEY_T,JOY_BUTTON_RIGHT_STICK],"game_options":[KEY_ESCAPE,JOY_BUTTON_START]}
	for action in bindings:
		if InputMap.has_action(action): continue
		InputMap.add_action(action,.4)
		var key = InputEventKey.new()
		key.physical_keycode = bindings[action][0]
		InputMap.action_add_event(action,key)
		var pad = InputEventJoypadButton.new()
		pad.device = -1
		pad.button_index = bindings[action][1]
		if bindings[action][1]>=0: InputMap.action_add_event(action,pad)
	var trigger = InputEventJoypadMotion.new()
	trigger.device=-1
	trigger.axis=JOY_AXIS_TRIGGER_LEFT
	trigger.axis_value=1
	if not InputMap.action_has_event("game_overdrive",trigger): InputMap.action_add_event("game_overdrive",trigger)
	for item in [["game_left",JOY_AXIS_LEFT_X,-1],["game_right",JOY_AXIS_LEFT_X,1],["game_up",JOY_AXIS_LEFT_Y,-1],["game_down",JOY_AXIS_LEFT_Y,1]]:
		var axis = InputEventJoypadMotion.new()
		axis.device = -1
		axis.axis = item[1]
		axis.axis_value = item[2]
		if not InputMap.action_has_event(item[0],axis): InputMap.action_add_event(item[0],axis)
		if not InputMap.action_has_event(item[0].replace("game_","ui_"),axis): InputMap.action_add_event(item[0].replace("game_","ui_"),axis)

	for entry in [["target_previous",KEY_Q,-1],["target_next",KEY_E,1]]:
		if not InputMap.has_action(entry[0]): InputMap.add_action(entry[0],.65)
		var key=InputEventKey.new();key.physical_keycode=entry[1]
		if not InputMap.action_has_event(entry[0],key): InputMap.action_add_event(entry[0],key)
		var axis=InputEventJoypadMotion.new();axis.device=-1;axis.axis=JOY_AXIS_RIGHT_X;axis.axis_value=entry[2]
		if not InputMap.action_has_event(entry[0],axis): InputMap.action_add_event(entry[0],axis)

func focus_modal() -> void:
	if not is_instance_valid(modal): return
	var controls: Array = []
	for node in modal.find_children("*","Control",true,false):
		if node.focus_mode==Control.FOCUS_ALL and node.is_visible_in_tree() and not (node is BaseButton and node.disabled): controls.append(node)
	for i in range(controls.size()):
		controls[i].focus_neighbor_top=controls[i].get_path_to(controls[(i-1+controls.size())%controls.size()])
		controls[i].focus_neighbor_bottom=controls[i].get_path_to(controls[(i+1)%controls.size()])
	if not controls.is_empty(): controls[0].grab_focus()

func refresh_prompts() -> void:
	prompt_nodes=prompt_nodes.filter(func(item): return is_instance_valid(item.node))
	for item in prompt_nodes: item.node.text=item.pad if last_input=="gamepad" else item.keyboard

func input_hint(keyboard: String, pad: String, font_size: int = 20) -> Label:
	var node=label(pad if last_input=="gamepad" else keyboard,font_size)
	node.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	prompt_nodes.append({"node":node,"keyboard":keyboard,"pad":pad})
	return node

func controller_changed(device: int, connected: bool) -> void:
	if not connected and (device==input_router.device_id or Input.get_connected_joypads().is_empty()):
		release_boost();input_router.reset()
		if is_instance_valid(game_notice): game_notice.text="CONTROLLER DISCONNECTED — reconnect or use keyboard."
		last_input="keyboard";refresh_prompts()

func cycle_target(direction: int) -> void:
	var candidates=snapshot.get("players",[]).filter(func(p): return p.id!=network.player_id and not p.get("dead",false) and (snapshot.get("mode")!="teams" or p.get("team")!=snapshot.get("team")))
	if candidates.is_empty(): return
	var index=-1
	for i in range(candidates.size()):
		if candidates[i].id==visual_target: index=i;break
	visual_target=candidates[posmod(index+direction,candidates.size())].id
	network.send_message({"type":"target","id":visual_target})

func release_boost() -> void:
	if boosting: network.send_message({"type":"boost","active":false})
	boosting = false

func _notification(what: int) -> void:
	if what==NOTIFICATION_WM_WINDOW_FOCUS_OUT and is_instance_valid(network): release_boost()

func _input(event: InputEvent) -> void:
	if event is InputEventJoypadButton and event.pressed or event is InputEventJoypadMotion and absf(event.axis_value)>.65:
		last_input="gamepad";input_router.device_id=event.device;refresh_prompts()
	if event is InputEventKey and event.pressed or event is InputEventMouseButton and event.pressed:
		last_input="keyboard";refresh_prompts()
	if event.is_action_pressed("ui_cancel"):
		if is_instance_valid(modal): close_modal()
		elif active:
			if training_mode: show_training_pause()
			else: show_pause()
		get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("game_options"):
		if is_instance_valid(modal): close_modal()
		elif screen_id=="arena":
			if training_mode: show_training_pause()
			else: show_pause()
		else: show_options()
		get_viewport().set_input_as_handled()
		return
	if not active or is_instance_valid(modal) or not is_instance_valid(battle_intro) or not battle_intro.can_play(): return
	if event.is_action_pressed("target_strategy") and not event.is_echo(): cycle_strategy();get_viewport().set_input_as_handled();return
	for entry in [["target_previous",-1],["target_next",1]]:
		if event.is_action_pressed(entry[0]) and not event.is_echo(): cycle_target(entry[1]);get_viewport().set_input_as_handled();return
	var owner = get_viewport().gui_get_focus_owner()
	if owner is LineEdit or owner is OptionButton: return
	if event.is_action_pressed("game_swap") and not event.is_echo():
		network.send_message({"type":"swap"});get_viewport().set_input_as_handled()
	if event.is_action_pressed("game_pulse") and not event.is_echo():
		network.send_ability("pulse");get_viewport().set_input_as_handled()
	for kind in ["shift","surge","overdrive"]:
		if event.is_action_pressed("game_"+kind) and not event.is_echo():
			network.send_ability(kind);get_viewport().set_input_as_handled()
	if event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_RIGHT:
		if own_board.get_global_rect().has_point(event.position): network.send_message({"type":"swap"})

func _process(delta: float) -> void:
	if screen_id=="arena" and is_instance_valid(own_board):
		var margin=maxi(24,int((size.x-1600)/2))
		screen.add_theme_constant_override("margin_left",margin);screen.add_theme_constant_override("margin_right",margin)
		refresh_training_hud()
		fit_battle_rivals()
		if is_instance_valid(battle_targeting): battle_targeting.reduced_motion=reduced_motion;battle_targeting.flashing=flashing_effects
		if is_instance_valid(screen): screen.position=own_board.fx.offset(true)
		if is_instance_valid(flux_meter):
			var goal=float(snapshot.get("self",{}).get("flux",0))
			flux_meter.reduced_motion=reduced_motion;flux_meter.flashing=flashing_effects
			flux_meter.value=goal if reduced_motion else move_toward(flux_meter.value,goal,ceilf(delta*800/5)*5)
			own_board.fx.meter(goal,flux_meter.max_value)
	if active and not is_instance_valid(modal) and is_instance_valid(battle_intro) and battle_intro.can_play() and (get_window().has_focus() or qa_mode):
		var owner = get_viewport().gui_get_focus_owner()
		if not (owner is LineEdit or owner is OptionButton):
			var raising = Input.is_action_pressed("game_raise")
			if raising!=boosting:
				boosting=raising;network.send_message({"type":"boost","active":raising})
			var axes=Input.get_vector("game_left","game_right","game_up","game_down",.45)
			var move=input_router.movement(delta,axes)
			if move!=Vector2i.ZERO: network.send_message({"type":"move","dx":move.x,"dy":move.y})
	else: input_router.reset()
	if qa_mode: run_ui_qa(delta)

func run_ui_qa(delta: float) -> void:
	qa_clock += delta
	if qa_stage==0 and not network.player_id.is_empty() and qa_clock>1:
		get_viewport().get_texture().get_image().save_png("res://../.web-smoke/godot-title.png")
		var pad = InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_DPAD_DOWN;pad.pressed=true
		Input.parse_input_event(pad)
		qa_stage=7;qa_clock=0
	elif qa_stage==7 and qa_clock>.2:
		var focus=get_viewport().gui_get_focus_owner()
		if not (focus is Button and focus.text=="HOST A ROOM"):
			push_error("Controller menu navigation failed");get_tree().quit(1);return
		var pad=InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_DPAD_DOWN;pad.pressed=false;Input.parse_input_event(pad)
		pad=InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_A;pad.pressed=true;Input.parse_input_event(pad)
		qa_stage=8;qa_clock=0
	elif qa_stage==8 and qa_clock>.2:
		var pad=InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_A;pad.pressed=false;Input.parse_input_event(pad)
		qa_stage=9;qa_clock=0
	elif qa_stage==9 and qa_clock>.2:
		if not is_instance_valid(modal):
			push_error("Controller menu confirm failed");get_tree().quit(1);return
		var pad=InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_B;pad.pressed=true;Input.parse_input_event(pad)
		pad=InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_B;pad.pressed=false;Input.parse_input_event(pad)
		qa_stage=10;qa_clock=0
	elif qa_stage==10 and qa_clock>.2:
		if is_instance_valid(modal):
			push_error("Controller menu back failed");get_tree().quit(1);return
		network.send_message({"type":"create","name":"Godot QA","mode":"teams","ruleset":"rush","bots":3,"difficulty":"easy","quick":true})
		qa_stage=1;qa_clock=0
	elif qa_stage==1 and active and snapshot.get("countdown",1)==0 and qa_clock>6:
		qa_cursor_start=int(snapshot.self.cursor.x)
		var pad = InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_DPAD_LEFT;pad.pressed=true
		Input.parse_input_event(pad)
		qa_stage=2;qa_clock=0
	elif qa_stage==2 and qa_clock>.3:
		var pad = InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_DPAD_LEFT;pad.pressed=false
		Input.parse_input_event(pad)
		if not int(snapshot.self.cursor.x)<qa_cursor_start:
			push_error("Synthetic gamepad movement did not reach authoritative state")
			get_tree().quit(1);return
		pad = InputEventJoypadButton.new()
		pad.button_index=JOY_BUTTON_A;pad.pressed=true
		Input.parse_input_event(pad)
		qa_stage=3;qa_clock=0
	elif qa_stage==3 and qa_clock>.4:
		if not qa_gamepad_swap:
			push_error("Synthetic gamepad swap did not reach server")
			get_tree().quit(1);return
		get_viewport().get_texture().get_image().save_png("res://../.web-smoke/godot-match.png")
		show_options()
		var choices = modal_body.find_children("*","OptionButton",true,false)
		choices[0].select(2);choices[0].item_selected.emit(2)
		choices[1].select(3);choices[1].item_selected.emit(3)
		qa_stage=4;qa_clock=0
	elif qa_stage==4 and qa_clock>2:
		get_viewport().get_texture().get_image().save_png("res://../.web-smoke/godot-options.png")
		close_modal();get_window().size=Vector2i(640,480)
		qa_stage=5;qa_clock=0
	elif qa_stage==5 and qa_clock>2:
		var bounds = own_board.get_global_rect()
		if bounds.position.y<0 or bounds.end.y>size.y:
			push_error("Resized board is clipped");get_tree().quit(1);return
		get_viewport().get_texture().get_image().save_png("res://../.web-smoke/godot-match-small.png")
		print("GODOT_UI_OK: game title, teams match, synthetic controller menu/move/swap, options, resized full board")
		qa_mode=false
		exit_game()

func exit_game() -> void:
	if shutting_down: return
	shutting_down=true
	if offline_pid>0: OS.kill(offline_pid);offline_pid=-1
	active=false
	release_boost()
	save_preferences()
	audio.shutdown()
	network.send_message({"type":"leave"})
	await get_tree().create_timer(.2).timeout
	get_tree().quit()

func _exit_tree() -> void:
	if offline_pid>0: OS.kill(offline_pid);offline_pid=-1

func safe_focus(node: Control) -> void:
	if is_instance_valid(node) and node.is_inside_tree() and node.is_visible_in_tree(): node.grab_focus()
