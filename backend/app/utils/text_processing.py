import re


def extract_snippet(content: str, query: str, max_length: int = 300) -> str:
    """
    Find the most query-relevant sentence in content and return it
    with query terms wrapped in <mark>...</mark> HTML tags.
    """
    terms = [t.lower() for t in query.split() if len(t) > 2]

    # Split content into sentences
    sentences = re.split(r"(?<=[.!?])\s+", content)

    if not sentences:
        return content[:max_length]

    # Score each sentence by how many query terms it contains
    def score(sentence: str) -> int:
        low = sentence.lower()
        return sum(1 for t in terms if t in low)

    best = max(sentences, key=score) if sentences else content

    # Truncate and add ellipsis if needed
    snippet = best[:max_length].rstrip()
    if len(best) > max_length:
        snippet += "..."

    # Highlight query terms — sort by length descending to avoid nested marks
    for term in sorted(terms, key=len, reverse=True):
        snippet = re.sub(
            rf"(?i)({re.escape(term)})",
            r"<mark>\1</mark>",
            snippet,
        )

    return snippet


def split_keywords(keywords_str: str) -> list[str]:
    """Convert a comma-separated keyword string to a list."""
    if not keywords_str:
        return []
    return [kw.strip() for kw in keywords_str.split(",") if kw.strip()]
