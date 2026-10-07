extends Control

signal selected
const PresentationEffects = preload("res://scripts/presentation_effects.gd")
var fx = PresentationEffects.new()
var active_ability = ""
var grid: Array = []
var blocks: Array = []
var cursor: Dictionary = {}
var matches: Array = []
var rise = 0.0
var palette = "arcade"
var miniature = false
var dead = false
var reduce_motion = false
var palettes: Dictionary = {}
var tile_textures: Dictionary = {}
var surfaces: Dictionary = {}
var effects: Array = []
var clock = 0.0
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	palettes = JSON.parse_string(FileAccess.get_file_as_string("res://assets/palettes.json"))

func update_board(player: Dictionary, own: Dictionary = {}) -> void:
	grid = player.get("grid", [])
	blocks = player.get("blocks", [])
	dead = player.get("dead", false)
	cursor = own.get("cursor", {})
	matches = own.get("matches", [])
	rise = own.get("rise", 0.0)
	active_ability = str(own.get("activeAbility")) if own.get("activeAbility")!=null else ""
	if fx.clock>=fx.hit_stop_until: queue_redraw()

func add_effect(text: String) -> void:
	if not miniature:
		effects.append({"text": text, "age": 0.0})

func _process(delta: float) -> void:
	clock += delta
	fx.reduced_motion=reduce_motion
	fx.advance(delta)
	for item in effects:
		item.age += delta
	effects = effects.filter(func(item): return item.age < 1.1)
	if fx.clock>=fx.hit_stop_until and (not miniature or not blocks.is_empty()):
		queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		selected.emit()

func pixel_texture(key: String, width: int, height: int, painter: Callable) -> Texture2D:
	if surfaces.has(key):
		return surfaces[key]
	var image = Image.create(width, height, false, Image.FORMAT_RGB8)
	painter.call(image)
	var texture = ImageTexture.create_from_image(image)
	if surfaces.size() > 32:
		surfaces.erase(surfaces.keys()[0])
	surfaces[key] = texture
	return texture

func background_texture() -> Texture2D:
	return pixel_texture("well:"+palette, 4, 4, func(image):
		for y in range(4):
			for x in range(4):
				image.set_pixel(x,y,Color(palettes[palette].well[0 if BAYER[y*4+x]<4 else 1])))

func slab_texture(block: Dictionary) -> Texture2D:
	var w = int(block.width)*60-2
	var h = int(block.height)*60-2
	var phase = 0 if reduce_motion else int(clock*4)%2
	var breaking = block.get("state") == "breaking"
	var key = "%s:%d:%d:%d:%s" % [palette,w,h,phase,breaking]
	return pixel_texture(key,w,h,func(image):
		var metal = palettes[palette].metal
		for y in range(h):
			for x in range(w):
				var color = Color.BLACK
				if x>0 and y>0 and x<w-1 and y<h-1:
					var density = 12 if y<h*.45 else (8 if y<h*.7 else 4)
					if y>=h-7:
						density = 4 if y>=h-4 else 8
					color = Color(metal[1] if BAYER[(int(y/2)%4)*4+int(x/2)%4]<density else (metal[3] if y>=h-7 else metal[2]))
					if y<=3:
						color = Color(metal[0])
					elif y<10:
						color = Color("#FF3B30" if palette=="arcade" else palettes[palette].dark[6]) if int((x+y)/4)%2==0 else Color("#310D3D" if (x+y)%2 else "#000000")
					elif (x+2)%60<2:
						color = Color(metal[3])
				var cx = int(w/2)
				var cy = int(h/2)
				if abs(x-cx)<10 and abs(y-cy)<10 and BAYER[((y+phase)%4)*4+(x+phase)%4]<(8 if phase else 4):
					color = Color.WHITE if breaking else Color(metal[0])
				if abs(x-cx)<6 and abs(y-cy)<6:
					color = Color(metal[0]) if abs(x-cx)<4 and abs(y-cy)<4 else Color.BLACK
					if abs(x-cx)<2 and abs(y-cy)<2:
						color = Color.WHITE if breaking else Color(metal[2])
				image.set_pixel(x,y,color))

func _draw() -> void:
	if palettes.is_empty():
		return
	var cell = minf(size.x/6.0,size.y/12.0)
	var bounds = Rect2(Vector2((size.x-cell*6)/2,0),Vector2(cell*6,cell*12))
	draw_set_transform(fx.offset())
	draw_texture_rect(background_texture(),bounds,true)
	var grouped = {}
	for block in blocks:
		for y in range(int(block.y),int(block.y+block.height)):
			for x in range(int(block.x),int(block.x+block.width)):
				grouped[y*6+x] = true
	for y in range(grid.size()):
		for x in range(grid[y].size()):
			var value = int(grid[y][x])
			if value<1 or value>4 or grouped.has(y*6+x):
				continue
			var key = palette+"-"+str(value)
			if not tile_textures.has(key):
				tile_textures[key] = load("res://assets/"+key+".png")
			var rect = Rect2(bounds.position+Vector2(x*cell,(y-rise)*cell),Vector2(cell,cell))
			var color = Color(.45,.45,.45) if dead else Color.WHITE
			if matches.has(y*6+x) and not reduce_motion and fx.flashing=="full":
				color = Color(2,2,2)
			draw_texture_rect(tile_textures[key],rect,false,color)
	for block in blocks:
		var rect = Rect2(bounds.position+Vector2(block.x*cell+cell/60,(block.y-rise)*cell+cell/60),Vector2(block.width*cell-cell/30,block.height*cell-cell/30))
		draw_texture_rect(slab_texture(block),rect,false)
	if not cursor.is_empty():
		var selection = Rect2(bounds.position+Vector2(cursor.x*cell+1,(cursor.y-rise)*cell+1),Vector2(cell*2-2,cell-2))
		draw_rect(selection,Color("#E0F7FA"),false,2)
	var font = get_theme_default_font()
	for item in effects:
		var point = bounds.position+Vector2(10,cell*5-(0 if reduce_motion else item.age*30))
		var text_size = mini(36,int(cell*.65))
		draw_rect(Rect2(point-Vector2(4,text_size),Vector2(cell*5.8,text_size+8)),Color.BLACK)
		draw_string(font,point,item.text,HORIZONTAL_ALIGNMENT_LEFT,-1,text_size,Color(palettes[palette].dark[5]))

	if not miniature: fx.paint(self,bounds,cell,active_ability)
