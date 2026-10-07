extends VBoxContainer

var reduced_effects = false
var catalog: Dictionary = {}
var topic: OptionButton
var picture: TextureRect
var caption: Label
var pause: Button
var atlas: AtlasTexture
var elapsed = 0.0
var paused = false

func _ready() -> void:
	catalog=JSON.parse_string(FileAccess.get_file_as_string("res://assets/tutorials/catalog.json"))
	add_theme_constant_override("separation",6)
	topic=OptionButton.new()
	for tutorial in catalog.tutorials: topic.add_item(tutorial.group+" / "+tutorial.title)
	topic.item_selected.connect(select_topic)
	add_child(topic)
	picture=TextureRect.new()
	picture.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	picture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.custom_minimum_size=Vector2(0,216)
	add_child(picture)
	pause=Button.new()
	pause.pressed.connect(func(): paused=not paused;update_frame())
	add_child(pause)
	caption=Label.new()
	caption.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	caption.add_theme_font_size_override("font_size",20)
	add_child(caption)
	select_topic(0)

func select_topic(index: int) -> void:
	topic.select(index);elapsed=0;paused=false
	var tutorial=catalog.tutorials[index]
	atlas=AtlasTexture.new()
	atlas.filter_clip=true
	atlas.atlas=load("res://assets/tutorials/"+tutorial.id+".png")
	picture.texture=atlas
	caption.text=tutorial.description
	update_frame()

func update_frame() -> void:
	var frame=int(catalog.still) if reduced_effects or paused else int(elapsed*catalog.fps)%int(catalog.frames)
	var region=Rect2(Vector2(frame%int(catalog.columns)*catalog.width,int(frame/int(catalog.columns))*catalog.height),Vector2(catalog.width,catalog.height))
	if atlas.region!=region: atlas.region=region
	pause.disabled=reduced_effects
	pause.text="REDUCED EFFECTS: STILL FRAME" if reduced_effects else ("PLAY ANIMATION" if paused else "PAUSE ANIMATION")

func _process(delta: float) -> void:
	if not paused and not reduced_effects: elapsed+=delta
	if is_instance_valid(atlas): update_frame()
