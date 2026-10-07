extends ProgressBar
var reduced_motion = false
var flashing = "full"
var clock = 0.0
var was_full = false
var spark_until = 0.0

func _process(delta: float) -> void:
	clock+=delta
	if value>=max_value and not was_full: spark_until=clock+.32
	was_full=value>=max_value
	queue_redraw()

func _draw() -> void:
	var fill=Color("#38FFFF")
	if not reduced_motion and flashing=="full" and value>=max_value*.75:
		fill=Color(["#38FFFF","#008299","#38FFFF","#FFFFFF"][int(clock/.16)%4])
	var filled=clampf(value/max_value,0,1)
	draw_rect(Rect2(Vector2.ZERO,Vector2(size.x*filled,size.y)),fill)
	for x in range(10): draw_rect(Rect2(Vector2(roundf(size.x*x/10),0),Vector2(2,size.y)),Color("#073644"))
	if was_full: draw_rect(Rect2(Vector2.ONE,size-Vector2(2,2)),Color.WHITE,false,1)
	if not reduced_motion and clock<spark_until:
		var frame=int((clock-(spark_until-.32))/.032)
		for direction in [-1,1]: draw_rect(Rect2(Vector2(roundf(size.x/2)+direction*(6+frame*3),-3),Vector2(2,2)),Color.WHITE)
