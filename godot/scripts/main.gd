extends Control

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
const PALETTE_IDS = ["arcade","midnight","tokyo","amber","frost"]
var network
var audio
var palettes: Dictionary = {}
var palette_id = "arcade"
var light_mode = false
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
	palettes = JSON.parse_string(FileAccess.get_file_as_string("res://assets/palettes.json"))
	if settings.load(settings_path) == ERR_FILE_NOT_FOUND and not qa_mode:
		# Import the previous title's preferences and records on first launch.
		settings.load(OS.get_user_data_dir().get_base_dir().path_join("Cascadia 99/settings.cfg"))
	palette_id = settings.get_value("appearance","palette","arcade")
	if not palettes.has(palette_id): palette_id = "arcade"
	light_mode = settings.get_value("appearance","light",false)
	reduced_motion = settings.get_value("appearance","reduced_motion",false)
	screen_shake = settings.get_value("appearance","screen_shake","normal")
	flashing_effects = settings.get_value("appearance","flashing_effects","full")
	best_score = settings.get_value("records","score",0)
	best_chain = settings.get_value("records","chain",0)
	wins = settings.get_value("records","wins",0)
	get_tree().auto_accept_quit = false
	get_window().close_requested.connect(exit_game)
	setup_actions()
	network = Network.new()
	add_child(network)
	network.received.connect(receive)
	network.connection_changed.connect(connection_changed)
	audio = Synth.new()
	add_child(audio)
	audio.track_id = settings.get_value("audio","track","neon")
	if not TRACK_IDS.has(audio.track_id): audio.track_id = "neon"
	audio.music_enabled = settings.get_value("audio","music",true)
	audio.sound_enabled = settings.get_value("audio","sound",true)
	apply_theme()
	show_title()
	var server_address=settings.get_value("network","server","http://127.0.0.1:3000")
	var arguments=OS.get_cmdline_user_args()
	for i in range(arguments.size()-1):
		if arguments[i]=="--server": server_address=arguments[i+1]
	network.connect_server(server_address)
	for arg in OS.get_cmdline_user_args():
		if arg=="--smoke-ui": qa_mode = true

func save_preferences() -> void:
	settings.set_value("appearance","palette",palette_id)
	settings.set_value("appearance","light",light_mode)
	settings.set_value("appearance","reduced_motion",reduced_motion)
	settings.set_value("appearance","screen_shake",screen_shake)
	settings.set_value("appearance","flashing_effects",flashing_effects)
	settings.set_value("audio","track",audio.track_id)
	settings.set_value("audio","music",audio.music_enabled)
	settings.set_value("audio","sound",audio.sound_enabled)
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
	var colors = palettes[palette_id]["light" if light_mode else "dark"]
	var native_theme = Theme.new()
	native_theme.default_font = load("res://assets/VT323-Regular.ttf")
	native_theme.default_font_size = 24
	native_theme.set_color("font_color","Label",Color(colors[3]))
	native_theme.set_color("font_color","Button",Color(colors[3]))
	native_theme.set_color("font_hover_color","Button",Color(colors[0]))
	native_theme.set_stylebox("normal","Button",style(Color(colors[1]),Color(colors[2])))
	native_theme.set_stylebox("hover","Button",style(Color(colors[5]),Color(colors[5])))
	native_theme.set_stylebox("pressed","Button",style(Color(colors[6]),Color(colors[6])))
	native_theme.set_stylebox("focus","Button",style(Color.TRANSPARENT,Color(colors[5])))
	for widget in ["LineEdit","OptionButton","SpinBox"]:
		native_theme.set_stylebox("normal",widget,style(Color(colors[0]),Color(colors[2])))
		native_theme.set_color("font_color",widget,Color(colors[3]))
	native_theme.set_stylebox("panel","PanelContainer",style(Color(colors[1]),Color(colors[2])))
	native_theme.set_color("font_color","CheckBox",Color(colors[3]))
	theme = native_theme
	for view in rival_views.values():
		view.palette = palette_id
		view.reduce_motion = reduced_motion
		view.fx.reduced_motion=reduced_motion
		view.fx.shake=screen_shake
		view.fx.flashing=flashing_effects
		view.queue_redraw()
	if is_instance_valid(own_board):
		own_board.palette = palette_id
		own_board.reduce_motion = reduced_motion
		own_board.fx.reduced_motion=reduced_motion
		own_board.fx.shake=screen_shake
		own_board.fx.flashing=flashing_effects
		own_board.queue_redraw()
	if is_instance_valid(screen):
		for mark in screen.find_children("*","TextureRect",true,false): mark.modulate=Color(colors[3]) if light_mode else Color.WHITE
	queue_redraw()

func _draw() -> void:
	if palettes.is_empty(): return
	var colors = palettes[palette_id]["light" if light_mode else "dark"]
	draw_rect(Rect2(Vector2.ZERO,size),Color(colors[0]))
	for x in range(0,int(size.x),40): draw_line(Vector2(x,0),Vector2(x,size.y),Color(colors[8]))
	for y in range(0,int(size.y),40): draw_line(Vector2(0,y),Vector2(size.x,y),Color(colors[8]))

func label(text: String, font_size: int = 24) -> Label:
	var node = Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size",font_size)
	return node

func button(text: String, callback: Callable) -> Button:
	var node = Button.new()
	node.text = text
	node.custom_minimum_size.y = 42
	node.pressed.connect(func(): audio.effect("swap");callback.call())
	return node

func full_rect(node: Control) -> void:
	node.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func reset_screen(id: String) -> void:
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
	active = false
	finished = false
	audio.stop_music()
	reset_screen("title")
	var center = CenterContainer.new()
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	shell.add_child(center)
	var menu = VBoxContainer.new()
	menu.custom_minimum_size.x = 460
	menu.add_theme_constant_override("separation",12)
	center.add_child(menu)
	var logo = TextureRect.new()
	logo.texture = load("res://assets/logo.svg")
	logo.modulate = Color(palettes[palette_id].light[3]) if light_mode else Color.WHITE
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	logo.custom_minimum_size = Vector2(460,74)
	menu.add_child(logo)
	var subtitle = label("CHAIN REACTION ARENA",28)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu.add_child(subtitle)
	menu.add_child(HSeparator.new())
	var first = button("CPU BATTLE",func(): show_setup(true))
	menu.add_child(first)
	menu.add_child(button("HOST A ROOM",func(): show_setup(false)))
	menu.add_child(button("JOIN A ROOM",show_join))
	menu.add_child(button("OPTIONS",show_options))
	menu.add_child(button("HOW TO PLAY",show_help))
	if not OS.has_feature("web"): menu.add_child(button("QUIT",exit_game))
	var records = label("BEST %d    CHAIN %dX    WINS %d" % [best_score,best_chain,wins],22)
	records.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu.add_child(records)
	status_label = label("CONNECTED" if not network.player_id.is_empty() else "CONNECTING...",20)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	shell.add_child(status_label)
	var hint = label("ARROWS / D-PAD: SELECT     ENTER / A: CONFIRM     ESC / B: BACK",20)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	shell.add_child(hint)
	first.call_deferred("grab_focus")

func open_modal(title: String) -> VBoxContainer:
	close_modal()
	release_boost()
	modal = PanelContainer.new()
	add_child(modal)
	modal.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	modal.position = size/2-Vector2(260,300)
	modal.size = Vector2(520,600)
	modal_body = VBoxContainer.new()
	modal_body.add_theme_constant_override("separation",10)
	modal.add_child(modal_body)
	modal_body.add_child(label(title,36))
	message_label = label("",20)
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return modal_body

func close_modal() -> void:
	if is_instance_valid(modal):
		remove_child(modal)
		modal.queue_free()
	modal = null
	if is_instance_valid(audio) and not active and screen_id=="title": audio.stop_music()
	if active: get_viewport().gui_release_focus()
	if screen_id=="title" and is_instance_valid(screen):
		var buttons = screen.find_children("*","Button",true,false)
		if not buttons.is_empty(): buttons[0].call_deferred("grab_focus")

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

func show_setup(quick: bool) -> void:
	var body = open_modal("CPU BATTLE" if quick else "HOST A ROOM")
	player_field(body)
	mode_picker = picker(MODE_NAMES)
	field(body,"MATCH MODE",mode_picker)
	rules_picker = picker(["CLASSIC","RUSH: +60% RISE"])
	field(body,"RULES",rules_picker)
	cpu_picker = picker(["1 CPU","3 CPUS","9 CPUS","24 CPUS","98 CPUS"])
	cpu_picker.select(2 if quick else 0)
	field(body,"CPU OPPONENTS",cpu_picker)
	difficulty_picker = picker(["EASY","NORMAL","HARD"])
	difficulty_picker.select(1)
	field(body,"CPU DIFFICULTY",difficulty_picker)
	mode_picker.item_selected.connect(func(index):
		cpu_picker.disabled = index!=0
		if index!=0: cpu_picker.select(0 if index==1 else 1))
	body.add_child(message_label)
	body.add_child(button("START BATTLE" if quick else "CREATE ROOM",func():
		if network.player_id.is_empty(): show_error("Connect to the server in Options first.");return
		var count = [1,3,9,24,98][cpu_picker.selected] if quick else 0
		settings.set_value("player","name",name_input.text)
		save_preferences()
		network.send_message({"type":"create","name":name_input.text,"mode":MODE_IDS[mode_picker.selected],"ruleset":"rush" if rules_picker.selected else "classic","bots":count,"difficulty":["easy","normal","hard"][difficulty_picker.selected],"quick":quick})))
	body.add_child(button("BACK",close_modal))
	mode_picker.grab_focus()

func show_join() -> void:
	var body = open_modal("JOIN A ROOM")
	player_field(body)
	room_input = LineEdit.new()
	room_input.max_length = 6
	room_input.placeholder_text = "A1B2C3"
	field(body,"SIX-CHARACTER ROOM CODE",room_input)
	body.add_child(label("Use the same server as your friends.\nChange the server address in Options.",22))
	body.add_child(message_label)
	body.add_child(button("JOIN ROOM",func(): network.send_message({"type":"join","name":name_input.text,"code":room_input.text.strip_edges().to_upper()})))
	body.add_child(button("BACK",close_modal))
	room_input.grab_focus()

func show_options() -> void:
	var body = open_modal("OPTIONS")
	var palette_picker = picker(PALETTE_IDS.map(func(id): return palettes[id].name))
	palette_picker.select(PALETTE_IDS.find(palette_id))
	field(body,"COLOR PALETTE",palette_picker)
	palette_picker.item_selected.connect(func(index): palette_id=PALETTE_IDS[index];apply_theme();save_preferences())
	var track_picker = picker(TRACK_IDS.map(func(id): return audio.tracks[id].name))
	track_picker.select(TRACK_IDS.find(audio.track_id))
	field(body,"SOUNDTRACK",track_picker)
	track_picker.item_selected.connect(func(index): audio.select_track(TRACK_IDS[index]);save_preferences())
	var choices = HBoxContainer.new()
	body.add_child(choices)
	for entry in [["MUSIC",audio.music_enabled],["SOUND",audio.sound_enabled],["LIGHT MODE",light_mode],["LESS MOTION",reduced_motion]]:
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
				"LIGHT MODE": light_mode=value
				"LESS MOTION": reduced_motion=value
			if not audio.music_enabled or not audio.sound_enabled: audio.stop_music()
			elif active and not finished: audio.start_music()
			apply_theme();save_preferences())
	var shake_picker = picker(["OFF","REDUCED","NORMAL","MAXIMUM"])
	shake_picker.select(["off","reduced","normal","maximum"].find(screen_shake))
	field(body,"SCREEN SHAKE",shake_picker)
	shake_picker.item_selected.connect(func(index): screen_shake=["off","reduced","normal","maximum"][index];apply_theme();save_preferences())
	var flash_picker = picker(["REDUCED","FULL"])
	flash_picker.select(0 if flashing_effects=="reduced" else 1)
	field(body,"FLASHING EFFECTS",flash_picker)
	flash_picker.item_selected.connect(func(index): flashing_effects="reduced" if index==0 else "full";apply_theme();save_preferences())
	server_input = LineEdit.new()
	server_input.text = settings.get_value("network","server","http://127.0.0.1:3000")
	field(body,"GAME SERVER ADDRESS",server_input)
	body.add_child(button("CONNECT TO SERVER",func():
		settings.set_value("network","server",server_input.text);save_preferences()
		network.send_message({"type":"leave"});network.connect_server(server_input.text);audio.stop_music();active=false
		close_modal();show_title()))
	if not active:
		body.add_child(button("PREVIEW / STOP MUSIC",func():
			if audio.playing: audio.stop_music()
			else: audio.target=0;audio.start_music()))
	else:
		body.add_child(label("Online matches continue while Options is open.",20))
	body.add_child(message_label)
	body.add_child(button("BACK",func():
		if not active: audio.stop_music()
		close_modal()))
	palette_picker.grab_focus()

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
	var text = label("Match 3 matching shapes in a row or column.\nSwap neighbors; falling matches create chains.\nBig combos and chains send garbage to rivals.\nClear next to a slab to break it into new tiles.\nEarn Flux with matches, combos, and chains.\nPulse 35: cancel a row or rescue your teammate.\nShift 60: lower a stable board. Surge 75: boost attacks for 8s.\nOverdrive 100: hold full Flux 3s, boost for 10s.\nStay below the ceiling. Last player or team wins.\n\nKEYBOARD\nArrows: move   Space: swap   Shift: raise   X: Pulse   C: Shift   V: Surge   B: Overdrive\nClick the board: position cursor. Right-click: swap.\n\nGAMEPAD\nD-pad / left stick: move   A / Cross: swap\nRB / R1: raise   X / Square: Pulse\nY / Triangle: Shift   LB / L1: Surge\nLeft trigger: Overdrive\nStart: Options   B / Circle: back",22)
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(text)
	var back=button("BACK",close_modal)
	body.add_child(back)
	back.call_deferred("grab_focus")

func show_error(text: String) -> void:
	if is_instance_valid(message_label): message_label.text = text
	if is_instance_valid(status_label): status_label.text = text
	if is_instance_valid(game_notice): game_notice.text = text

func connection_changed(connected: bool, detail: String) -> void:
	if is_instance_valid(status_label): status_label.text = detail
	if not connected and not network.connecting:
		audio.stop_music();release_boost();active=false
		show_error(detail)

func show_lobby(message: Dictionary) -> void:
	active = false
	finished = false
	audio.stop_music()
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
	active = true
	finished = false
	countdown = -1
	reset_screen("arena")
	var top = HBoxContainer.new()
	shell.add_child(top)
	hud = label("GET READY",28)
	hud.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(hud)
	top.add_child(button("OPTIONS",show_options))
	top.add_child(button("LEAVE",func(): network.send_message({"type":"leave"})))
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
	own_board.palette = palette_id
	own_board.reduce_motion = reduced_motion
	own_board.fx.shake=screen_shake
	own_board.fx.flashing=flashing_effects
	board_fit.add_child(own_board)
	own_board.selected.connect(board_clicked)
	own_board.landed.connect(func(_block): audio.effect("garbage"))
	var side = VBoxContainer.new()
	side.custom_minimum_size.x = 500
	arena.add_child(side)
	game_notice = label("GET READY / ROOM "+room_code,28)
	game_notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	side.add_child(game_notice)
	flux_label=label("FLUX 0 / 100",24)
	flux_label.modulate=Color("#00E5FF")
	side.add_child(flux_label)
	flux_meter=FluxMeter.new()
	flux_meter.max_value=flux_config.get("max",100)
	flux_meter.show_percentage=false
	flux_meter.custom_minimum_size.y=14
	flux_meter.add_theme_stylebox_override("background",style(Color("#06171C"),Color("#008DA6")))
	flux_meter.add_theme_stylebox_override("fill",style(Color("#00E5FF"),Color("#00E5FF")))
	side.add_child(flux_meter)
	ability_timer=label("BUILD FLUX",22)
	side.add_child(ability_timer)
	incoming_label=label("INCOMING 0",22)
	side.add_child(incoming_label)
	target_label=label("AUTO TARGET / WAITING FOR ATTACK",20)
	target_label.visible=message.mode=="battle"
	side.add_child(target_label)
	var ability_grid=GridContainer.new()
	ability_grid.columns=2
	side.add_child(ability_grid)
	ability_buttons.clear()
	for kind in ["pulse","shift","surge","overdrive"]:
		var ability=kind
		var action_button=button(kind.to_upper(),func(): network.send_ability(ability))
		action_button.add_theme_font_size_override("font_size",22)
		action_button.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		action_button.disabled=true
		ability_grid.add_child(action_button)
		ability_buttons[kind]=action_button
	pulse_button=ability_buttons.pulse
	var targeting = picker(["RANDOM TARGET","NEAR TOP","ATTACKERS","MOST KOS"])
	target_picker=targeting
	targeting.item_selected.connect(func(index): network.send_message({"type":"mode","mode":["random","danger","attackers","badges"][index]}))
	side.add_child(targeting)
	var scroll = ScrollContainer.new()
	rival_scroll=scroll
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	side.add_child(scroll)
	rival_grid = GridContainer.new()
	rival_grid.columns = 3 if message.total<=4 else 5
	rival_grid.add_theme_constant_override("h_separation",8)
	rival_grid.add_theme_constant_override("v_separation",8)
	scroll.add_child(rival_grid)
	var hints = label("ARROWS / STICK: MOVE    SPACE / A: SWAP   SHIFT / RB: RAISE   X / PAD X: PULSE   C / Y: SHIFT   V / LB: SURGE   B / LT: OVERDRIVE",20)
	hints.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	shell.add_child(hints)
	audio.target = 0
	audio.start_music()
	battle_targeting=BattleTargeting.new()
	add_child(battle_targeting)
	battle_targeting.begin(str(message.matchId),network.player_id,own_board,rival_views,message.mode=="battle")
	if attack_match==str(message.matchId): battle_targeting.last_sequence=attack_sequence
	else: attack_match=str(message.matchId);attack_sequence=0
	visual_target=""
	battle_targeting.reduced_motion=reduced_motion;battle_targeting.flashing=flashing_effects
	get_viewport().gui_release_focus()

func board_clicked() -> void:
	get_viewport().gui_release_focus()
	if not active or snapshot.is_empty(): return
	var cell = minf(own_board.size.x/6.0,own_board.size.y/12.0)
	var point = own_board.get_local_mouse_position()-Vector2((own_board.size.x-cell*6)/2,0)
	var cx = clampi(int(point.x/cell),0,4)
	var cy = clampi(int(point.y/cell+own_board.rise),0,11)
	var selected = snapshot.self.cursor
	for n in range(absi(cx-int(selected.x))): network.send_message({"type":"move","dx":signi(cx-int(selected.x)),"dy":0})
	for n in range(absi(cy-int(selected.y))): network.send_message({"type":"move","dx":0,"dy":signi(cy-int(selected.y))})

func update_snapshot(message: Dictionary) -> void:
	snapshot = message
	if screen_id!="arena": return
	var own = message.self
	var pending=0
	for packet in own.get("incoming",[]): pending+=int(packet.amount)
	incoming_label.text="INCOMING %d BLOCKS" % pending
	if is_instance_valid(target_picker): target_picker.select(maxi(0,["random","danger","attackers","badges"].find(own.get("targetMode","random"))))
	hud.text = "ALIVE %d   SCORE %d   KOS %d   %02d:%02d" % [message.remaining,own.score,own.kos,int(message.elapsed/60),int(message.elapsed)%60]
	flux_label.text="FLUX %d / %d" % [own.get("flux",0),flux_config.get("max",100)]
	var keys={"pulse":"X","shift":"C","surge":"V","overdrive":"B"}
	for kind in ability_buttons:
		ability_buttons[kind].text="%s %d / %s" % [kind.to_upper(),flux_config.get(kind,{}).get("cost",0),keys[kind]]
		ability_buttons[kind].disabled=not own.get("abilities",{}).get(kind,false) or message.countdown>0 or finished
	var effect=own.get("activeAbility")
	ability_timer.text=("%s %.1fs" % [str(effect).to_upper(),own.abilityRemaining]) if effect!=null else (("OVERDRIVE %.1fs" % maxf(0,flux_config.get("overdrive",{}).get("hold",3)-own.get("maxFluxHeld",0))) if own.get("flux",0)>=flux_config.get("max",100) else "BUILD FLUX")
	audio.overdrive=effect=="overdrive"
	var self_player = {}
	for player in message.players:
		if player.id==network.player_id: self_player = player
	if self_player.is_empty(): return
	own_board.update_board(self_player,own)
	best_score = maxi(best_score,int(own.score))
	best_chain = maxi(best_chain,int(own.get("bestChain",0)))
	if not self_player.dead: audio.update_pressure(self_player.grid)
	if not finished and not self_player.dead:
		game_notice.text = "GET READY: %d" % message.countdown if message.countdown>0 else ("DANGER! CLEAR THE TOP" if own.danger>0 else "ROOM "+room_code+" / BUILD YOUR CHAIN")
	if countdown!=int(message.countdown):
		countdown = int(message.countdown)
		audio.effect("countdown")
	for player in message.players:
		if player.id==network.player_id: continue
		if not rival_views.has(player.id):
			var stack = VBoxContainer.new()
			rival_grid.add_child(stack)
			var view = BoardView.new()
			view.custom_minimum_size = Vector2(150,300) if message.players.size()<=4 else Vector2(24,48)
			view.palette = palette_id
			view.reduce_motion = reduced_motion
			view.fx.shake=screen_shake
			view.fx.flashing=flashing_effects
			view.miniature = true
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
	if message.mode=="battle" and own.get("attackTarget")==null: target_label.text="AUTO TARGET / CHOSEN WHEN ATTACKING"
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
		if message.type=="attack": incoming_label.text="INCOMING %d / %s" % [message.amount,message.from]
	match message.get("type",""):
		"resumed": room_code=message.room;host_id=message.host
		"resumeRejected": snapshot={};show_title();show_error("Session expired. Join a new room.")
		"hello": flux_config=message.get("fluxConfig",{})
		"abilityRejected": show_error("Ability unavailable: check Flux, stable board, and active effects.")
		"ability":
			audio.effect(str(message.ability))
			if is_instance_valid(own_board): own_board.add_effect(str(message.ability).to_upper()+"!")
		"error": show_error(message.get("message","Server error"))
		"left": release_boost();save_preferences();snapshot={};show_title()
		"lobby": show_lobby(message)
		"start": show_arena(message)
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
			if is_instance_valid(own_board): own_board.add_effect("BREAK!")
		"pulse":
			audio.effect("pulse")
			if is_instance_valid(own_board): own_board.add_effect("TEAM RESCUE!" if message.get("assist",false) else "PULSE!")
		"eliminated": audio.stop_music();active=false;game_notice.text="ELIMINATED #%d / WATCH THE FIELD" % message.place;audio.effect("lose")
		"finished":
			active=false;finished=true;release_boost();audio.stop_music()
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
		InputMap.action_add_event(entry[0],event)
	var bindings = {"game_left":[KEY_LEFT,JOY_BUTTON_DPAD_LEFT],"game_right":[KEY_RIGHT,JOY_BUTTON_DPAD_RIGHT],"game_up":[KEY_UP,JOY_BUTTON_DPAD_UP],"game_down":[KEY_DOWN,JOY_BUTTON_DPAD_DOWN],"game_swap":[KEY_SPACE,JOY_BUTTON_A],"game_raise":[KEY_SHIFT,JOY_BUTTON_RIGHT_SHOULDER],"game_pulse":[KEY_X,JOY_BUTTON_X],"game_shift":[KEY_C,JOY_BUTTON_Y],"game_surge":[KEY_V,JOY_BUTTON_LEFT_SHOULDER],"game_overdrive":[KEY_B,-1],"game_options":[KEY_ESCAPE,JOY_BUTTON_START]}
	for action in bindings:
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
	InputMap.action_add_event("game_overdrive",trigger)
	for item in [["game_left",JOY_AXIS_LEFT_X,-1],["game_right",JOY_AXIS_LEFT_X,1],["game_up",JOY_AXIS_LEFT_Y,-1],["game_down",JOY_AXIS_LEFT_Y,1]]:
		var axis = InputEventJoypadMotion.new()
		axis.device = -1
		axis.axis = item[1]
		axis.axis_value = item[2]
		InputMap.action_add_event(item[0],axis)
		InputMap.action_add_event(item[0].replace("game_","ui_"),axis)

func release_boost() -> void:
	if boosting: network.send_message({"type":"boost","active":false})
	boosting = false

func _notification(what: int) -> void:
	if what==NOTIFICATION_WM_WINDOW_FOCUS_OUT and is_instance_valid(network): release_boost()

func _input(event: InputEvent) -> void:
	if event is InputEventJoypadButton or event is InputEventJoypadMotion: last_input="gamepad"
	if event is InputEventKey or event is InputEventMouse: last_input="keyboard"
	if event.is_action_pressed("ui_cancel"):
		if is_instance_valid(modal): close_modal()
		elif active: show_options()
		get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("game_options"):
		if is_instance_valid(modal): close_modal()
		elif screen_id=="arena": show_options()
		else: show_options()
		get_viewport().set_input_as_handled()
		return
	if not active or is_instance_valid(modal) or snapshot.get("countdown",1)>0: return
	var owner = get_viewport().gui_get_focus_owner()
	if owner is LineEdit or owner is OptionButton: return
	if event.is_action_pressed("game_swap"):
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
		fit_battle_rivals()
		if is_instance_valid(battle_targeting): battle_targeting.reduced_motion=reduced_motion;battle_targeting.flashing=flashing_effects
		if is_instance_valid(screen): screen.position=own_board.fx.offset(true)
		if is_instance_valid(flux_meter):
			var goal=float(snapshot.get("self",{}).get("flux",0))
			flux_meter.reduced_motion=reduced_motion;flux_meter.flashing=flashing_effects
			flux_meter.value=goal if reduced_motion else move_toward(flux_meter.value,goal,ceilf(delta*800/5)*5)
			own_board.fx.meter(goal,flux_meter.max_value)
	if active and not is_instance_valid(modal) and snapshot.get("countdown",1)==0 and get_window().has_focus():
		var owner = get_viewport().gui_get_focus_owner()
		if not (owner is LineEdit or owner is OptionButton):
			var raising = Input.is_action_pressed("game_raise")
			if raising!=boosting:
				boosting=raising;network.send_message({"type":"boost","active":raising})
			move_repeat-=delta
			for entry in [["game_left",-1,0],["game_right",1,0],["game_up",0,-1],["game_down",0,1]]:
				if Input.is_action_just_pressed(entry[0]) or (Input.is_action_pressed(entry[0]) and move_repeat<=0):
					network.send_message({"type":"move","dx":entry[1],"dy":entry[2]});move_repeat=.12;break
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
	active=false
	release_boost()
	save_preferences()
	audio.shutdown()
	network.send_message({"type":"leave"})
	await get_tree().create_timer(.2).timeout
	get_tree().quit()
