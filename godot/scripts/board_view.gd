extends Control

signal selected
const PresentationEffects = preload("res://scripts/presentation_effects.gd")
var fx = PresentationEffects.new()
var active_ability = ""
var viewport: SubViewport
var painter: Control
var swap_animation: Dictionary = {}
var fall_moves: Array = []
var fall_serial = -1
var fall_started = -100.0
var clear_started = -100.0
var clear_key = ""
var drops: Dictionary = {}
var breaks: Dictionary = {}
signal landed(block: Dictionary)
var grid: Array = []
var blocks: Array = []
var cursor: Dictionary = {}
var matches: Array = []
var rise = 0.0
var palette = "arcade"
var miniature = false
var targeted = false
var player_number = 0
var attack_mark = ""
var attack_until = -1.0
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
	viewport=SubViewport.new()
	viewport.size=Vector2i(360,720)
	viewport.transparent_bg=true
	viewport.disable_3d=true
	viewport.render_target_update_mode=SubViewport.UPDATE_WHEN_PARENT_VISIBLE
	viewport.canvas_item_default_texture_filter=Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	add_child(viewport)
	painter=Control.new()
	painter.size=Vector2(360,720)
	painter.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	painter.draw.connect(func(): paint_board(painter))
	viewport.add_child(painter)

func update_board(player: Dictionary, own: Dictionary = {}) -> void:
	grid = player.get("grid", [])
	if not palettes.is_empty(): fx.tile_colors=palettes[palette].tiles.map(func(tile): return tile.color)
	blocks = player.get("blocks", [])
	var live_ids=blocks.map(func(block): return str(block.id))
	for key in breaks.keys():
		if not live_ids.has(key): breaks.erase(key)
	dead = player.get("dead", false)
	var next_cursor: Dictionary = own.get("cursor", {})
	cursor = next_cursor
	if int(own.get("fallSerial",-1))!=fall_serial:
		fall_serial=int(own.get("fallSerial",-1));fall_moves=own.get("falls",[]);fall_started=clock
	var key=str(own.get("matches",[]))+str(own.get("chain",0))+str(own.get("score",0)) if own.get("phase")=="clear" else ""
	if key!=clear_key: clear_key=key;clear_started=clock
	matches = own.get("matches", [])
	rise = own.get("rise", 0.0)
	active_ability = str(own.get("activeAbility")) if own.get("activeAbility")!=null else ""
	if fx.clock>=fx.hit_stop_until and is_instance_valid(painter): painter.queue_redraw();queue_redraw()

func add_effect(text: String) -> void:
	if not miniature:
		effects.append({"text": text.replace("×","X"), "age": 0.0})
		if effects.size()>6: effects=effects.slice(-6)

func _process(delta: float) -> void:
	clock += delta
	fx.reduced_motion=reduce_motion
	fx.advance(delta)
	for item in effects:
		item.age += delta
	effects = effects.filter(func(item): return item.age < .768)
	if fx.clock>=fx.hit_stop_until and not miniature:
		painter.queue_redraw();queue_redraw()

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
	var phase = 0 if reduce_motion or fx.flashing=="reduced" else int(clock/.128)%2
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
						color = Color(("#FFB81C" if breaking and phase and fx.flashing=="full" else "#FF3B30") if palette=="arcade" else palettes[palette].dark[6]) if int((x+y)/4)%2==0 else Color("#310D3D" if (x+y)%2 else "#000000")
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

func paint_board(view: Control) -> void:
	if palettes.is_empty():
		return
	var cell = 60.0
	var bounds = Rect2(Vector2.ZERO,Vector2(360,720))
	view.draw_set_transform(fx.offset())
	view.draw_texture_rect(background_texture(),bounds,true)
	if not miniature: fx.paint(view,bounds,cell,"",true)
	view.draw_set_transform(fx.offset()+Vector2(0,fx.shift_offset()))
	var grouped = {}
	for block in blocks:
		for y in range(int(block.y),int(block.y+block.height)):
			for x in range(int(block.x),int(block.x+block.width)):
				grouped[y*6+x] = true
	for y in range(grid.size()):
		for x in range(grid[y].size()):
			var value = int(grid[y][x])
			if value<1 or value>4 or grouped.has(y*6+x) or (not swap_animation.is_empty() and clock-swap_animation.start<.128 and not reduce_motion and y==int(swap_animation.y) and x in [int(swap_animation.x),int(swap_animation.x)+1]):
				continue
			var key = palette+"-"+str(value)
			if not tile_textures.has(key):
				tile_textures[key] = load("res://assets/"+key+".png")
			var draw_y=float(y)
			if not reduce_motion and clock-fall_started<.16:
				for move in fall_moves:
					if int(move.x)==x and int(move.to)==y and int(move.value)==value: draw_y=lerpf(move.from,move.to,PresentationEffects.stepped(clock-fall_started,.16))
			var rect = Rect2(Vector2(roundf(x*cell),roundf((draw_y-rise)*cell)),Vector2(cell,cell))
			var color = Color(.45,.45,.45) if dead else Color.WHITE
			var flash_frame=int((clock-clear_started)/.032)
			if matches.has(y*6+x) and not reduce_motion:
				if flash_frame<4 and flash_frame%2==0 and fx.flashing=="full": color=Color(2,2,2)
				if flash_frame==3: rect.position.y+=3;rect.size.y-=6
			view.draw_texture_rect(tile_textures[key],rect,false,color)
	if not swap_animation.is_empty() and clock-swap_animation.start<.128 and not reduce_motion:
		var t=PresentationEffects.stepped(clock-swap_animation.start,.128,5)
		for entry in [[swap_animation.left,float(swap_animation.x)+t],[swap_animation.right,float(swap_animation.x)+1-t]]:
			draw_tile(view,int(entry[0]),Vector2(roundf(float(entry[1])*60),roundf((float(swap_animation.y)-rise)*60)))
	for block in blocks:
		var rect = Rect2(bounds.position+Vector2(block.x*cell+cell/60,(block_y(block)-rise)*cell+cell/60),Vector2(block.width*cell-cell/30,block.height*cell-cell/30))
		rect.position=rect.position.round()
		view.draw_texture_rect(slab_texture(block),rect,false)
		if not reduce_motion:
			var age=clock-float(breaks.get(str(block.id),clock))
			var breaking=block.get("state")=="breaking"
			var color=Color("#38FFFF" if breaking and fx.flashing=="full" and age<.128 and int(age/.032)%2==0 else "#008299")
			for dx in range(3,int(rect.size.x)-3,12): view.draw_rect(Rect2(rect.position+Vector2(dx,roundf(rect.size.y/2)),Vector2(6,2)),color)
			if breaking:
				var frame=mini(7,int(age/.032))
				for n in range(4): view.draw_rect(Rect2(rect.position+Vector2(roundf(rect.size.x*(n+1)/5),3+frame*3),Vector2(3,minf(9,rect.size.y-6))),color)
	view.draw_set_transform(fx.offset())
	var top=12
	for y in range(grid.size()):
		if grid[y].any(func(value): return value!=0): top=y;break
	for item in effects:
		var frame=int(item.age/.032)
		var unit=3 if reduce_motion else (2 if frame==0 else (4 if frame==1 and (item.text.begins_with("CHAIN") or item.text=="OVERDRIVE!") else 3))
		if not reduce_motion and frame>20 and frame%2: continue
		var point=Vector2(PresentationEffects.snap(180-item.text.length()*6*unit/2.0),PresentationEffects.snap(54-(0 if reduce_motion else mini(4,int(frame/3))*3)))
		if point.y+7*unit>(top-rise)*60: continue
		fx.bitmap_text(view,item.text,point+Vector2(3,3),unit,Color.BLACK)
		var text_color=Color("#00E5A3" if item.text.begins_with("CHAIN") else ("#FFAE03" if item.text.ends_with("COMBO!") else ("#F8F9FA" if item.text.begins_with("+") else "#00E5FF")))
		fx.bitmap_text(view,item.text,point,unit,text_color)
	if not miniature: fx.paint(view,bounds,cell,active_ability,false,grid,rise)
	if not cursor.is_empty(): paint_selector(view)

func draw_tile(view: Control, value: int, point: Vector2) -> void:
	if value<1 or value>4: return
	var key=palette+"-"+str(value)
	if not tile_textures.has(key): tile_textures[key]=load("res://assets/"+key+".png")
	view.draw_texture_rect(tile_textures[key],Rect2(point,Vector2(60,60)),false)

func cursor_at() -> Dictionary:
	return cursor

func selector_border(view: Control, rect: Rect2, thickness: int, color: Color) -> void:
	view.draw_rect(Rect2(rect.position,Vector2(rect.size.x,thickness)),color)
	view.draw_rect(Rect2(rect.position+Vector2(0,rect.size.y-thickness),Vector2(rect.size.x,thickness)),color)
	if rect.size.y>2*thickness:
		view.draw_rect(Rect2(rect.position+Vector2(0,thickness),Vector2(thickness,rect.size.y-2*thickness)),color)
		view.draw_rect(Rect2(rect.position+Vector2(rect.size.x-thickness,thickness),Vector2(thickness,rect.size.y-2*thickness)),color)

func paint_selector(view: Control) -> void:
	view.draw_set_transform(Vector2.ZERO)
	var offset=fx.offset()
	var x=clampf(roundf(cursor.x*60+offset.x),0,240)
	var top=roundf((cursor.y-rise)*60+offset.y)
	var y=maxf(0,top)
	var height=minf(720,top+60)-y
	if height<=0: return
	var outer=maxi(1,mini(7,int(height/3)))
	var inset=mini(2,int(height/6))
	var bright=mini(3,maxi(1,outer-inset))
	var rect=Rect2(x,y,120,height)
	selector_border(view,rect,outer,Color("#10131A"))
	var color=Color("#E0FFFF" if not reduce_motion and fx.flashing=="full" and int(clock/.5)%2 else "#FFFFFF")
	selector_border(view,rect.grow(-inset),bright,color)

func handle_event(message: Dictionary) -> void:
	var kind=str(message.get("ability",message.get("type","")))
	if kind=="swap": swap_animation=message.duplicate();swap_animation.start=clock
	if kind=="garbage":
		for block in message.get("blocks",[]): drops[str(block.id)]={"start":clock,"impact":false}
		return
	if kind=="break":
		for block in message.get("blocks",[]): breaks[str(block.id)]=clock
	var positions=message.get("positions",[0,1,2,3,4,5] if kind=="pulse" else ([30,35,36,41] if kind in ["shift","surge","overdrive"] else []))
	var details=message.duplicate()
	details.particle_values={}
	for p in positions:
		var y=int(floorf(float(p)/6));var x=int(p)%6
		if y>=0 and y<grid.size() and int(grid[y][x]) in [1,2,3,4]: details.particle_values[int(p)]=int(grid[y][x])
	fx.trigger(kind,positions,rise,details)

func block_y(block: Dictionary) -> float:
	var key=str(block.id)
	if not drops.has(key): return float(block.y)
	var drop: Dictionary = drops[key]
	var t=1.0 if reduce_motion else PresentationEffects.stepped(clock-drop.start,.24,7)
	if t>=1:
		if not drop.impact:
			drop.impact=true
			var positions: Array = []
			for x in range(int(block.width)): positions.append(mini(11,int(block.y+block.height-1))*6+int(block.x)+x)
			fx.trigger("garbage",positions,rise,{"size":block.width*block.height})
			landed.emit(block)
		drops.erase(key)
	return lerpf(-float(block.height),float(block.y),t*t)

func _draw() -> void:
	if not is_instance_valid(viewport): return
	var cell=minf(size.x/6.0,size.y/12.0)
	var rect=Rect2(Vector2(roundf((size.x-cell*6)/2),0),Vector2(roundf(cell*6),roundf(cell*12)))
	draw_texture_rect(viewport.get_texture(),rect,false)
	if miniature:
		if targeted: draw_rect(rect.grow(-2),Color("#FFB81C"),false,3)
		if not attack_mark.is_empty(): draw_rect(rect.grow(-4),Color("#FF4D5E" if attack_mark=="incoming" else "#FFB81C"),false,2)
		if player_number>0:
			draw_rect(Rect2(rect.position+Vector2(2,2),Vector2(16,12)),Color("#10131A"))
			fx.bitmap_text(self,"%02d" % player_number,rect.position+Vector2(3,3),1,Color.WHITE)
