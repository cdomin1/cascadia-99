extends RefCounted
# One owner now; device ID is kept separately for future local ownership.
var device_id = -1
var direction = Vector2i.ZERO
var repeat_at = 0.0
var clock = 0.0
var initial_delay = .23
var repeat_delay = .075
func movement(delta: float, axes: Vector2) -> Vector2i:
	clock+=delta
	var next=Vector2i.ZERO
	if axes.length()>=.45:
		if absf(axes.x)>absf(axes.y): next.x=1 if axes.x>0 else -1
		elif absf(axes.y)>absf(axes.x): next.y=1 if axes.y>0 else -1
		elif direction!=Vector2i.ZERO: next=direction
		else: next.x=1 if axes.x>0 else -1
	if next==Vector2i.ZERO: direction=next;return Vector2i.ZERO
	if next!=direction: direction=next;repeat_at=clock+initial_delay;return next
	if clock>=repeat_at: repeat_at=clock+repeat_delay;return next
	return Vector2i.ZERO
func reset() -> void:
	direction=Vector2i.ZERO
	repeat_at=clock
