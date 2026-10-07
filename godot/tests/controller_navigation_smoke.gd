extends SceneTree
const Main=preload("res://scripts/main.gd")
var main
func _initialize() -> void: call_deferred("run")
func press(index: int) -> void:
	var event=InputEventJoypadButton.new();event.device=0;event.button_index=index;event.pressed=true
	Input.parse_input_event(event);await process_frame
	event.pressed=false;Input.parse_input_event(event);await process_frame
func run() -> void:
	main=Main.new();root.add_child(main);main.set_process(false);main.close_modal()
	for method in ["show_setup","show_join","show_tutorial_menu","show_practice_menu","show_options"]:
		if method=="show_setup": main.show_setup(true)
		else: main.call(method)
		await process_frame;main.focus_modal();await process_frame
		var first=root.gui_get_focus_owner();assert(is_instance_valid(first))
		await press(JOY_BUTTON_DPAD_DOWN)
		var next=root.gui_get_focus_owner();assert(is_instance_valid(next));assert(main.modal.is_ancestor_of(next))
		main.close_modal();await process_frame
	main.show_options();await process_frame;main.focus_modal()
	var sliders=main.modal.find_children("*","HSlider",true,false)
	assert(sliders.size()==2)
	sliders[0].grab_focus();var before=sliders[0].value;await press(JOY_BUTTON_DPAD_LEFT);assert(sliders[0].value<before)
	main.close_modal();await process_frame
	main.shutting_down=true;main.audio.shutdown();main.queue_free();await process_frame;await process_frame;await create_timer(.2).timeout
	print("NATIVE_CONTROLLER_NAV_OK: setup, join code, tutorial, practice, settings, focus containment and volume slider")
	quit(0)
