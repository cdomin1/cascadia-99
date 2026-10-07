extends RefCounted

# Shared bitmap alphabet/palette; all effects use opaque pixels and discrete frames.
static var data: Dictionary = {}
static var ring_cache: Dictionary = {}
const PIXEL = 3
const FRAME = .032
const SHAKE = {"off":0.0,"reduced":.35,"normal":1.0,"maximum":1.7}
var clock = 0.0
var shake = "normal"
var flashing = "full"
var reduced_motion = false
var impacts: Array = []
var waves: Array = []
var sweeps: Array = []
var particles: Array = []
var flashes: Array = []
var sparks: Array = []
var hit_stop_until = 0.0
var shift_started = -100.0
var was_full = false
var tile_colors: Array = ["#FF6B97","#38FFFF","#66FF1A","#FFB81C"]

func _init() -> void:
	if data.is_empty(): data=JSON.parse_string(FileAccess.get_file_as_string("res://assets/retro-vfx.json"))

static func snap(value: float) -> float:
	return roundf(value/PIXEL)*PIXEL

static func stepped(age: float, duration: float, frames: int = 6) -> float:
	return clampf(floorf(age/duration*frames)/(frames-1),0,1)

func advance(delta: float) -> void:
	clock += delta
	impacts=impacts.filter(func(i): return clock-i.start<i.duration)
	waves=waves.filter(func(i): return clock-i.start<.384)
	sweeps=sweeps.filter(func(i): return clock-i.start<.256)
	particles=particles.filter(func(i): return clock-i.start<.384)
	flashes=flashes.filter(func(i): return clock-i.start<.128)
	sparks=sparks.filter(func(i): return clock-i.start<.320)

func meter(flux: float, maximum: float) -> void:
	var full=flux>=maximum
	if full and not was_full: trigger("full")
	was_full=full

func trigger(kind: String, positions: Array = [], rise: float = 0.0, details: Dictionary = {}) -> void:
	if reduced_motion: return
	var chain=int(details.get("chain",1))
	var count=int(details.get("count",3))
	var strength=0
	var duration=.096
	match kind:
		"effect": strength=4 if chain>=5 else (3 if chain==4 else (2 if chain>=2 else (1 if count>=4 else 0)));duration=.16 if chain>=4 else .096
		"overdrive": strength=4;duration=.16
		"garbage": strength=mini(5,3+int(details.get("size",6)/12));duration=.16
		"pulse": strength=2
		"attack": strength=1
	var color=Color(data.magenta[0] if kind=="overdrive" else data.cyan[0])
	if strength>0: impacts.append({"start":clock,"strength":strength,"duration":duration,"direction":Vector2(0,1) if kind=="garbage" else Vector2.ONE,"viewport":false})
	if kind in ["pulse","surge","overdrive"] or (kind=="effect" and chain>1): waves.append({"start":clock,"color":color})
	if kind=="shift": sweeps.append({"start":clock,"color":color});shift_started=clock
	if kind=="full": sparks.append({"start":clock,"color":color})
	if flashing=="full" and kind in ["pulse","overdrive","garbage"]:
		flashes.append({"start":clock,"color":color});hit_stop_until=clock+(.064 if kind=="overdrive" else .032)
	for position in positions:
		for n in range(8):
			var angle=n*TAU/8
			particles.append({"start":clock,"origin":Vector2(int(position)%6+.5,floorf(float(position)/6)+.5-rise)*60,"velocity":Vector2(cos(angle),sin(angle))*(120+int(position)%3*30)*minf(1.8,1+maxi(0,chain-1)*.16),"color":Color(tile_colors[int(details.get("particle_values",{}).get(int(position),1+int(position)%4))-1]),"size":3+n%2*3})
	if particles.size()>300: particles=particles.slice(-300)
	if impacts.size()>8: impacts=impacts.slice(-8)
	if waves.size()>8: waves=waves.slice(-8)
	if sweeps.size()>4: sweeps=sweeps.slice(-4)
	if flashes.size()>4: flashes=flashes.slice(-4)
	if sparks.size()>4: sparks=sparks.slice(-4)

func shift_offset() -> float:
	return snap(-60*(1-stepped(clock-shift_started,.16,5))) if not reduced_motion and clock-shift_started<.16 else 0.0

func offset(viewport: bool = false) -> Vector2:
	if reduced_motion: return Vector2.ZERO
	var pattern=[Vector2(1,0),Vector2(-1,1),Vector2(0,-1),Vector2(1,1),Vector2(-1,0)]
	var result=Vector2.ZERO
	for item in impacts:
		if item.viewport!=viewport or clock-item.start>=item.duration: continue
		var frame=int((clock-item.start)/FRAME)
		var amount=roundf(item.strength*SHAKE.get(shake,1.0))
		result+=pattern[frame%pattern.size()]*item.direction*amount*PIXEL
	return Vector2(snap(result.x),snap(result.y))

func bitmap_text(view: Control, text: String, point: Vector2, unit: int, color: Color) -> void:
	var x=snap(point.x)
	var y=snap(point.y)
	for character in text.to_upper().replace("×","X"):
		var glyph=data.font.get(character,data.font[" "])
		for row in range(7):
			for col in range(5):
				if glyph[row][col]=="1": view.draw_rect(Rect2(Vector2(x+col*unit,y+row*unit),Vector2(unit,unit)),color)
		x+=6*unit

func pixel_ring(view: Control, center: Vector2, radius: float, color: Color) -> void:
	var r=maxi(1,roundi(radius/PIXEL))
	if not ring_cache.has(r):
		var points: Array = []
		for y in range(-r,r+1):
			for x in range(-r,r+1):
				var distance=x*x+y*y
				if distance<=r*r and distance>(r-1)*(r-1): points.append(Vector2(x,y)*PIXEL)
		if ring_cache.size()>=64: ring_cache.erase(ring_cache.keys()[0])
		ring_cache[r]=points
	for point in ring_cache[r]: view.draw_rect(Rect2(center+point,Vector2(PIXEL,PIXEL)),color)

func paint(view: Control, bounds: Rect2, _cell: float, active: String, back_only: bool = false, grid: Array = [], rise: float = 0.0) -> void:
	if not reduced_motion and back_only:
		for wave in waves:
			var frame=int((clock-wave.start)/FRAME)
			pixel_ring(view,bounds.get_center(),12+frame*12,Color.WHITE if frame%3==0 else wave.color)
		for sweep in sweeps:
			var frame=int((clock-sweep.start)/FRAME)
			for x in range(0,360,6): view.draw_rect(Rect2(Vector2(x,snap(frame/8.0*720)+(3 if x%12 else 0)),Vector2(3,6)),sweep.color if frame%2 else Color.WHITE)
	if not reduced_motion and back_only:
		for spark in sparks:
			var frame=int((clock-spark.start)/FRAME)
			for n in range(8):
				var angle=n*TAU/8
				view.draw_rect(Rect2(Vector2(snap(180+cos(angle)*(15+frame*9)),snap(9+sin(angle)*(9+frame*3))),Vector2(3,3)),spark.color)
	if not reduced_motion and not back_only:
		for particle in particles:
			var frame=int((clock-particle.start)/FRAME)
			if frame>8 and frame%2: continue
			var t=frame*FRAME
			var point: Vector2 = particle.origin+particle.velocity*t+Vector2(0,180*t*t)
			point=Vector2(snap(point.x),snap(point.y))
			var occupied=false
			for py in [point.y,point.y+particle.size-1]:
				for px in [point.x,point.x+particle.size-1]:
					var row=int(floorf(py/60+rise));var col=int(floorf(px/60))
					if row>=0 and row<grid.size() and col>=0 and col<6 and grid[row][col]!=0: occupied=true
			if occupied: continue
			view.draw_rect(Rect2(Vector2(snap(point.x),snap(point.y)),Vector2.ONE*particle.size),Color.WHITE if frame<2 else particle.color)
		if flashing=="full":
			for flash in flashes:
				var frame=int((clock-flash.start)/FRAME)
				if frame in [0,2]: view.draw_rect(bounds.grow(-1.5),Color.WHITE if frame==0 else flash.color,false,3)
	if not back_only and not active.is_empty():
		var palette=data.magenta if active=="overdrive" else data.cyan
		var frame=int(clock/.16) if not reduced_motion else 0
		var color=Color(palette[frame%3] if flashing=="full" and not reduced_motion else palette[0])
		for x in range(0,360,12):
			view.draw_rect(Rect2(Vector2(x,0),Vector2(9,3)),color);view.draw_rect(Rect2(Vector2(x,717),Vector2(9,3)),color)
		for y in range(0,720,12):
			view.draw_rect(Rect2(Vector2(0,y),Vector2(3,9)),color);view.draw_rect(Rect2(Vector2(357,y),Vector2(3,9)),color)
		if not reduced_motion:
			var y=snap(int(clock/FRAME)*9%720)
			view.draw_rect(Rect2(Vector2(0,y),Vector2(6,12)),Color.WHITE);view.draw_rect(Rect2(Vector2(354,708-y),Vector2(6,12)),Color.WHITE)
