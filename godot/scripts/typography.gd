extends RefCounted

const SOURCE = preload("res://assets/fonts/kode-mono/KodeMono-Variable.ttf")
static var fonts: Dictionary = {}

static func face(weight: int = 400) -> Font:
	if not fonts.has(weight):
		var variation = FontVariation.new()
		variation.base_font = SOURCE
		variation.variation_opentype = {"wght": weight}
		variation.fallbacks = [ThemeDB.fallback_font]
		fonts[weight] = variation
	return fonts[weight]
