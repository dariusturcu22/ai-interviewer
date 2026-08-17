from app.llm import _repair_string_array

# Actual malformed key_points value captured from a real failure via the
# malformed-tool-output diagnostic logging (docker logs), where the model leaked
# its old XML-based tool-calling syntax into an array field.
REAL_MALFORMED_KEY_POINTS = (
    "\n<item>Entry point into the fandom was visual/artistic-character design and art "
    "style were the primary draws, not community or social factors</item>\n<item>"
    "Involvement began in mid-adolescence (age 16), a common age for discovering online "
    "fandoms and identity exploration</item>\n<item>Has created multiple fursonas (wolf "
    "and shark), suggesting an interest in exploring different facets of "
    "self-representation</item>\n<item>Species choices are based on personal resonance "
    "and affinity rather than a clearly articulated symbolic meaning</item>\n"
    "</key_points>\n</invoke>\n"
)


def test_repairs_real_captured_malformed_output():
    repaired = _repair_string_array(REAL_MALFORMED_KEY_POINTS)
    assert repaired == [
        "Entry point into the fandom was visual/artistic-character design and art "
        "style were the primary draws, not community or social factors",
        "Involvement began in mid-adolescence (age 16), a common age for discovering "
        "online fandoms and identity exploration",
        "Has created multiple fursonas (wolf and shark), suggesting an interest in "
        "exploring different facets of self-representation",
        "Species choices are based on personal resonance and affinity rather than a "
        "clearly articulated symbolic meaning",
    ]


def test_returns_none_for_a_well_formed_list():
    assert _repair_string_array(["already", "a", "list"]) is None


def test_returns_none_for_a_plain_string_with_no_tags():
    assert _repair_string_array("just a normal string") is None


def test_returns_none_for_empty_string():
    assert _repair_string_array("") is None
