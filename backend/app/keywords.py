import yake

MAX_KEYWORDS = 8


def extract_keywords(transcript: list[dict]) -> list[str]:
    text = " ".join(turn["answer"] for turn in transcript)
    if not text.strip():
        return []

    extractor = yake.KeywordExtractor(lan="en", n=2, top=MAX_KEYWORDS)
    ranked = extractor.extract_keywords(text)
    return [keyword for keyword, _score in ranked]
