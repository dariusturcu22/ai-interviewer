import yake

MAX_KEYWORDS = 8


def extract_keywords(transcript: list[dict]) -> list[str]:
    text = " ".join(turn["answer"] for turn in transcript)
    if not text.strip():
        return []

    # Ask YAKE for more candidates than we need: on short interview answers it commonly
    # ranks a phrase (e.g. "mom sarmale") and the single words that make it up (e.g. "mom",
    # "sarmale") as separate, independently-scored keywords, so filtering overlaps below
    # can still leave a full list.
    extractor = yake.KeywordExtractor(lan="en", n=2, top=MAX_KEYWORDS * 3)
    ranked = [keyword for keyword, _score in extractor.extract_keywords(text)]

    selected: list[str] = []
    for keyword in ranked:
        overlaps = [kept for kept in selected if keyword in kept or kept in keyword]
        if overlaps:
            # Keep whichever version is more specific (longer) - drop the plain word
            # once its phrase is already in the list, or vice versa if the phrase
            # shows up after the word it was built from.
            if all(len(keyword) > len(kept) for kept in overlaps):
                selected = [k for k in selected if k not in overlaps]
                selected.append(keyword)
            continue
        selected.append(keyword)
        if len(selected) == MAX_KEYWORDS:
            break
    return selected[:MAX_KEYWORDS]
