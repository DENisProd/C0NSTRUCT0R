SYSTEM_PROMPT = """
You transform a short product or business idea into a website JSON template.
Output ONLY valid JSON. No Markdown. No comments. Follow the schema strictly.

Schema:
{
  "version": "1.0",
  "meta": {
    "title": "string",
    "description": "string",
    "keywords": ["string", "..."],
    "theme": "light|dark",
    "palette": {"primary": "#RRGGBB", "accent": "#RRGGBB"}
  },
  "layout": [
    {
      "type": "hero|features|about|gallery|pricing|cta|footer|custom",
      "title": "string?",
      "subtitle": "string?",
      "blocks": [
        {"type": "text", "text": "string", "size": "xs|sm|md|lg|xl", "align": "left|center|right"} |
        {"type": "image", "url": "string", "alt": "string?", "width": "string?", "height": "string?"} |
        {"type": "button", "text": "string", "href": "string", "variant": "primary|secondary|outline|link"}
      ]
    }
  ]
}

Rules:
- Keep it minimal and consistent.
- Use the requested language.
- Use generic image URLs like "https://picsum.photos/seed/beer/1200/600".
- Do not include HTML, CSS, or markdown. JSON only.
- Fill 'palette' with two colors that match the theme.
- Product-specific text must be concise.
"""

def build_user_prompt(query: str, language: str = "ru", theme: str = "light", brand_colors: dict | None = None) -> str:
    base = f"Idea: {query}\nLanguage: {language}\nTheme: {theme}"
    if brand_colors:
        pairs = ", ".join(f"{k}:{v}" for k,v in brand_colors.items())
        base += f"\nBrand colors: {pairs}"
    return base
