from app.interviews.keywords import extract_keywords

# Reproduces a real result: short answers about the same few words ("mom", "sarmale",
# "christmas") made YAKE return both a phrase and the individual words it's built from
# as separate, unranked-together keywords (e.g. "mom sarmale" and "mom").
SARMALE_TRANSCRIPT = [
    {
        "question": "What's a food memory that stands out?",
        "answer": "My mom made sarmale for Christmas every year.",
    },
    {
        "question": "Who else was involved?",
        "answer": (
            "My parents, grandparents, and an uncle sat around the table, but mom "
            "did all the cooking herself, prepared in advance."
        ),
    },
    {
        "question": "Where did this happen?",
        "answer": "At my parents' place, same spot every Christmas.",
    },
]


def test_extract_keywords_drops_single_words_subsumed_by_a_kept_phrase():
    keywords = extract_keywords(SARMALE_TRANSCRIPT)

    for keyword in keywords:
        overlapping = [
            other
            for other in keywords
            if other != keyword and (keyword in other or other in keyword)
        ]
        assert not overlapping, f"{keyword!r} overlaps with {overlapping!r}"


def test_extract_keywords_returns_empty_list_for_blank_transcript():
    assert extract_keywords([{"question": "Q", "answer": "   "}]) == []
