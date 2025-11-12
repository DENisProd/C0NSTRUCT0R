from typing import List, Dict, Any, Optional
import json
import re

from google import genai
from google.genai import types 

from app.core.config import settings
from app.schemas.ai import GenerateLandingResponse
from app.schemas.palette import PaletteSchema



SYSTEM_PROMPT = """
Ты — генератор JSON-конфигурации для конструктора лендингов. Выход всегда строго один JSON-объект без текста вокруг, без комментариев, без пояснений.

1. Назначение
- На вход приходит свободный промпт пользователя по-русски или по-английски: например "сделай сайт пиво", "лендинг для онлайн-школы", "сайт для юристов".
- Ты анализируешь тематику и желаемую стилистику (тон, ощущения, аудитория).
- На выходе формируешь структуру лендинга и цветовую палитру.

2. Формат ответа
Корневой объект:
{
  "blocks": [...],
  "palette": {...}
}

2.1 blocks — массив блоков. Каждый блок:
- обязательные поля: "id", "type", "style"
- id: любая уникальная строка, например "block-<случайное-число>"
- type: один из: "text", "image", "button", "video", "container", "grid"
- style: объект c CSS-подобными строками: "padding", "margin", "backgroundColor", "fontSize", "fontWeight", "textAlign", "color", "width", "borderRadius" и т.п.

Дополнительные поля по типу:
- type="text": поле "content" (строка)
- type="image": поле "url" (строка с URL или плейсхолдером)
- type="button": поля "text" (надпись на кнопке) и "link" (строка URL), опционально "buttonColor"
- type="container": поле "children": массив дочерних блоков (text / image / button / grid / container)
- type="grid": поля:
  "settings": { "columns": number, "rows": number, "gapX": number, "gapY": number }
  "cells": массив объектов { "block": Block | null }

2.2 palette — объект:
{
  "primary": "#RRGGBB",
  "secondary": "#RRGGBB",
  "background": "#RRGGBB",
  "text": "#RRGGBB",
  "accent": "#RRGGBB",
  "surface": "#RRGGBB",
  "border": "#RRGGBB"
}
Все значения — валидные HEX вида "#112233".

3. Логика построения лендинга
- Обязательно должна быть hero-секция в начале (крупный заголовок, подзаголовок, кнопка CTA).
- Далее 2–4 смысловых блока в зависимости от промпта: преимущества, каталог, тарифы, отзывы, контакты и т.п.
- Если переданы категории (hero, features, testimonials, pricing, cta, about, contact), старайся использовать именно их.
- Стиль блоков (цвета, фон, контрасты) должен соответствовать тематике:
  - пиво / бар — тёплые янтарные, коричневые, тёмный фон;
  - IT / стартап — светлые чистые фоны, акцентные неоновые или синие;
  - премиум / юристы — много воздуха, минимализм, спокойные контрасты.

4. Ограничения
- Никакого текста вне JSON.
- Никаких комментариев внутри JSON.
- Не используй поля, которых нет в описании формата, кроме безопасных UI-полей (например, "align", "justify").
"""


def _build_user_prompt(user_prompt: str, categories: Optional[List[str]] = None) -> str:
    categories_text = ", ".join(categories) if categories else "нет"
    return (
        "Сгенерируй структуру лендинга для конструктора сайтов.\n"
        f"Свободное описание от пользователя: {user_prompt!r}.\n"
        f"Предпочтительные категории блоков: {categories_text}.\n"
        "Подбери блоки и палитру, которые лучше всего отражают стиль и тематику описания.\n"
        "Ответ верни строго в формате JSON, описанном в системной инструкции."
    )


def _extract_json(text: str) -> Dict[str, Any]:
    """Извлекает JSON-объект из произвольного текстового ответа модели."""
    cleaned = text.strip()

    # Удаляем Markdown-кодовые блоки ```json ... ```
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9]*\s*", "", cleaned)
        cleaned = re.sub(r"```\s*$", "", cleaned)

    # Обрезаем всё до первого '{' и последней '}'
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]

    return json.loads(cleaned)


class GeminiLLMGenerator:
    """Генератор лендингов на базе Gemini API."""

    @staticmethod
    def _get_client() -> genai.Client:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY не задан в переменных окружения")
        return genai.Client(api_key=api_key)

    @staticmethod
    def generate_landing(
        prompt: str,
        categories: Optional[List[str]] = None,
    ) -> GenerateLandingResponse:
        client = GeminiLLMGenerator._get_client()

        # Склеиваем системный промпт и пользовательский в один текст
        user_prompt = _build_user_prompt(prompt, categories)
        full_prompt = SYSTEM_PROMPT.strip() + "\n\n---\n\n" + user_prompt

        # Без JSON-mode и без system_instruction — просто текстовый ответ
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=full_prompt,
        )

        # Основной путь — использовать свойство text
        text = getattr(response, "text", None)
        if not text:
            # Запасной путь — собрать текст из candidates/parts
            parts: List[str] = []
            for candidate in getattr(response, "candidates", []) or []:
                content = getattr(candidate, "content", None)
                if not content:
                    continue
                for part in getattr(content, "parts", []) or []:
                    value = getattr(part, "text", None)
                    if value:
                        parts.append(value)
            if not parts:
                raise RuntimeError("Пустой ответ от Gemini: не удалось извлечь текст")
            text = "\n".join(parts)

        data = _extract_json(text)

        blocks = data.get("blocks")
        palette_data = data.get("palette")

        if not isinstance(blocks, list) or not isinstance(palette_data, dict):
            raise ValueError("Ответ Gemini не содержит корректные поля 'blocks' и 'palette'")

        palette = PaletteSchema(**palette_data)

        meta: Dict[str, Any] = {
            "model": settings.GEMINI_MODEL,
            "provider": "gemini",
            "prompt": prompt,
            "categories": categories or [],
        }

        return GenerateLandingResponse(
            blocks=blocks,
            palette=palette,
            meta=meta,
        )


