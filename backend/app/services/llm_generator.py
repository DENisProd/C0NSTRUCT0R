from copy import deepcopy
from typing import List, Dict, Any, Optional
import random

from app.core.config import settings
from app.schemas.ai import GenerateLandingResponse
from app.schemas.palette import PaletteSchema


class MockLLMGenerator:
    BLOCK_TEMPLATES: List[Dict[str, Any]] = [...]
    PALETTES: List[Dict[str, Any]] = [...]

    @staticmethod
    def _normalize_block(block: Dict[str, Any]) -> Dict[str, Any]:
        """Гарантируем, что у блока и всех детей есть style."""
        if block.get("style") is None:
            block["style"] = {}

        if "children" in block and isinstance(block["children"], list):
            block["children"] = [
                MockLLMGenerator._normalize_block(child)
                for child in block["children"]
            ]

        return block

    @staticmethod
    def _generate_mock_landing(
        prompt: str,
        categories: Optional[List[str]] = None,
    ) -> GenerateLandingResponse:
        categories = categories or []

        num_blocks = random.randint(3, 5)
        selected_blocks = random.sample(
            MockLLMGenerator.BLOCK_TEMPLATES,
            min(num_blocks, len(MockLLMGenerator.BLOCK_TEMPLATES)),
        )

        blocks: List[Dict[str, Any]] = []
        for i, template in enumerate(selected_blocks):
            block = deepcopy(template)
            block["id"] = f"{block['type']}-{i+1}"
            block = MockLLMGenerator._normalize_block(block)
            blocks.append(block)

        palette_data = random.choice(MockLLMGenerator.PALETTES)
        palette = PaletteSchema(**palette_data)

        meta: Dict[str, Any] = {
            "model": "mock-llm-v1.0",
            "prompt": prompt,
            "categories": categories,
            "blocks_count": len(blocks),
        }

        return GenerateLandingResponse(
            blocks=blocks,
            palette=palette,
            meta=meta,
        )

    @staticmethod
    def generate_landing(
        prompt: str,
        categories: Optional[List[str]] = None,
    ) -> GenerateLandingResponse:
        categories = categories or []

        if not settings.GEMINI_API_KEY:
            return MockLLMGenerator._generate_mock_landing(prompt, categories)

        from app.services.gemini_landing_generator import GeminiLLMGenerator
        return GeminiLLMGenerator.generate_landing(prompt, categories)
