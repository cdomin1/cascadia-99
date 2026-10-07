extends RefCounted

# Local presentation clock only. No SceneTree pause, time_scale, or network delays.
var clock = 0.0
var shake = "normal"
var flashing = "full"
var reduced_motion = false
var impacts: Array = []
var waves: Array = []
var sweeps: Array = []
var particles: Array = []
var flashes: Array = []
var hit_stop_until = 0.0
const SHAKE = {"off":0.0,"reduced":.35,"normal":1.0,"maximum":1.7}

func advance(delta: float) -> void:
	clock += delta
	impacts = impacts.filter(func(item): return clock-item.start<.25)
	waves = waves.filter(func(item): return clock-item.start<.65)
	sweeps = sweeps.filter(func(item): return clock-item.start<.6)
	particles = particles.filter(func(item): return clock-item.start<.7)
	flashes = flashes.filter(func(item): return clock-item.start<.18)

func trigger(kind: String, positions: Array = [], rise: float = 0.0) -> void:
	if reduced_motion: return
	var heavy = kind=="overdrive"
	var color = Color("#FF6BDE" if heavy else "#00E5FF")
	if kind in ["pulse","surge","overdrive","garbage","attack"]:
		impacts.append({"start":clock,"strength":2.0 if heavy else 1.0,"direction":Vector2(-1,1) if kind=="attack" else Vector2(.35,1),"viewport":heavy or kind=="attack"})
		waves.append({"start":clock,"color":color})
	if kind=="shift": sweeps.append({"start":clock,"color":color})
	if flashing=="full" and kind in ["pulse","overdrive","garbage"]:
		flashes.append({"start":clock,"color":color})
		hit_stop_until=clock+(.065 if heavy else .035)
	for position in positions:
		for n in range(6):
			var angle = n*TAU/6
			particles.append({"start":clock,"origin":Vector2(int(position)%6+.5,int(position)/6+.5-rise),"velocity":Vector2(cos(angle),sin(angle))*2.5,"color":color})
	if particles.size()>240: particles=particles.slice(-240)

func offset(viewport: bool = false) -> Vector2:
	if reduced_motion: return Vector2.ZERO
	var result = Vector2.ZERO
	for item in impacts:
		if item.viewport!=viewport: continue
		var age = clock-item.start
		var amplitude = (1-age/.25)*4*item.strength*SHAKE.get(shake,1.0)
		result += Vector2(sin(age*90),cos(age*80))*item.direction*amplitude
	return result

func paint(view: Control, bounds: Rect2, cell: float, active: String) -> void:
	if not reduced_motion:
		for wave in waves:
			var t = (clock-wave.start)/.65
			var color: Color = wave.color
			color.a = (1-t)*.75
			view.draw_arc(bounds.get_center(),cell*.2+t*bounds.size.x*.8,0,TAU,48,color,3)
		for sweep in sweeps:
			var t = (clock-sweep.start)/.6
			var color: Color = sweep.color
			color.a = (1-t)*.7
			view.draw_rect(Rect2(bounds.position+Vector2(0,t*bounds.size.y),Vector2(bounds.size.x,6)),color)
		for particle in particles:
			var age = clock-particle.start
			var point: Vector2 = bounds.position+(particle.origin+particle.velocity*age+Vector2(0,3*age*age))*cell
			var color: Color = particle.color
			color.a = 1-age/.7
			view.draw_rect(Rect2(point,Vector2(3,3)),color)
		if flashing=="full":
			for flash in flashes:
				var color: Color = flash.color
				color.a = (1-(clock-flash.start)/.18)*.8
				view.draw_rect(bounds.grow(-4),color,false,8)
	if not active.is_empty():
		var color = Color("#FF6BDE" if active=="overdrive" else "#00E5FF")
		view.draw_rect(bounds.grow(-3),color,false,3)
		if not reduced_motion:
			var y = fmod(clock*120,bounds.size.y)
			for x in [bounds.position.x+3,bounds.end.x-3]:
				view.draw_line(Vector2(x,bounds.position.y+y),Vector2(x,bounds.position.y+minf(y+20,bounds.size.y)),Color.WHITE,3)
