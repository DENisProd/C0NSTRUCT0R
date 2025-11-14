import json
from typing import Any, Dict

def coerce_json(s: str) -> Dict[str, Any]:
    """Parse a JSON string, handling empty inputs and code fences robustly."""
    s = (s or "").strip()
    if not s:
        raise ValueError("Empty JSON response from model")

    # Strip code fences like ```json ... ``` or ``` ... ```
    if s.startswith("```"):
        # remove leading/trailing backticks and newlines
        s = s.strip("`\n")
        # optional language hint
        if s.startswith("json\n"):
            s = s[5:]

    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # Try extracting the first JSON-looking object between braces
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = s[start:end+1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError as e:
                # Re-raise with a clearer message snippet
                snippet = candidate[:200]
                raise ValueError(f"Failed to parse JSON from model response. Snippet: {snippet}") from e
        # No braces found or still failing
        snippet = s[:200]
        raise ValueError(f"Model response is not valid JSON. Snippet: {snippet}")
