extends ProgressBar
const NeoVector = preload("res://scripts/neo_vector.gd")
var neo=NeoVector.specification()
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
	var fill=Color(neo.colors.flux)
	var filled=clampf(value/max_value,0,1)*10
	for segment in range(10):
		var rect=Rect2(Vector2(segment*size.x/10+2,2),Vector2(size.x/10-4,size.y-4))
		draw_rect(rect,Color(neo.colors.surface))
		draw_rect(rect,Color(neo.colors.flux),false,1,true)
		var fraction=clampf(filled-segment,0,1)
		if fraction>0: draw_rect(Rect2(rect.position,Vector2(rect.size.x*fraction,rect.size.y)),fill)
	if was_full:
		draw_rect(Rect2(Vector2.ONE,size-Vector2(2,2)),Color(neo.colors.neutral),false,1.5,true)
	if not reduced_motion and clock<spark_until:
		var t=(clock-(spark_until-.32))/.32
		for direction in [-1,1]: draw_line(Vector2(size.x/2+direction*(6+t*30),0),Vector2(size.x/2+direction*(12+t*30),-4),fill,1.5,true)
