extends RefCounted

# Presentation-only; values match neo-vector.mjs. Never use these for simulation.
static var tokens: Dictionary = {}

static func specification() -> Dictionary:
	if tokens.is_empty():
		tokens = JSON.parse_string(FileAccess.get_file_as_string("res://assets/neo-vector.json"))
	return tokens
