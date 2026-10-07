extends SceneTree
const Router=preload("res://scripts/input_router.gd")
func _initialize() -> void:
	var router=Router.new()
	assert(router.movement(.01,Vector2(.2,.1))==Vector2i.ZERO)
	assert(router.movement(.01,Vector2(.9,.7))==Vector2i.RIGHT)
	assert(router.movement(.1,Vector2(.9,.7))==Vector2i.ZERO)
	assert(router.movement(.14,Vector2(.9,.7))==Vector2i.RIGHT)
	assert(router.movement(.01,Vector2(0,-1))==Vector2i.UP)
	router.reset()
	assert(router.movement(.01,Vector2(0,-1))==Vector2i.UP)
	print("NATIVE_INPUT_ROUTER_OK")
	quit(0)
