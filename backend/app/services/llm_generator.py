import random
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.ai import GenerateLandingResponse
from app.schemas.palette import PaletteSchema


class MockLLMGenerator:
    """Mock генератор лендингов (заглушка для LLM)"""
    
    # Примеры блоков для генерации
    BLOCK_TEMPLATES = [
        {
            "type": "text",
            "id": "text-1",
            "content": "Добро пожаловать на наш сайт!",
            "style": {
                "fontSize": "32px",
                "fontWeight": "bold",
                "textAlign": "center",
                "color": "#000000",
                "margin": "20px 0"
            }
        },
        {
            "type": "text",
            "id": "text-2",
            "content": "Мы предлагаем лучшие решения для вашего бизнеса",
            "style": {
                "fontSize": "18px",
                "textAlign": "center",
                "color": "#666666",
                "margin": "10px 0"
            }
        },
        {
            "type": "button",
            "id": "button-1",
            "text": "Начать",
            "link": "#",
            "style": {
                "padding": "12px 24px",
                "borderRadius": "8px",
                "backgroundColor": "#007bff",
                "color": "#ffffff",
                "margin": "20px auto",
                "display": "block"
            }
        },
        {
            "type": "image",
            "id": "image-1",
            "url": "https://via.placeholder.com/800x400",
            "style": {
                "width": "100%",
                "maxWidth": "800px",
                "margin": "20px auto",
                "display": "block",
                "borderRadius": "8px"
            }
        },
        {
            "type": "container",
            "id": "container-1",
            "children": [
                {
                    "type": "text",
                    "id": "text-3",
                    "content": "Наши преимущества",
                    "style": {
                        "fontSize": "24px",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "margin": "20px 0"
                    }
                }
            ],
            "style": {
                "padding": "20px",
                "backgroundColor": "#f5f5f5",
                "borderRadius": "8px",
                "margin": "20px 0"
            }
        }
    ]
    
    # Предустановленные палитры
    PALETTES = [
        {
            "primary": "#007bff",
            "secondary": "#6c757d",
            "background": "#ffffff",
            "text": "#212529",
            "accent": "#28a745",
            "surface": "#f8f9fa",
            "border": "#dee2e6"
        },
        {
            "primary": "#6f42c1",
            "secondary": "#e83e8c",
            "background": "#ffffff",
            "text": "#343a40",
            "accent": "#fd7e14",
            "surface": "#f8f9fa",
            "border": "#dee2e6"
        },
        {
            "primary": "#20c997",
            "secondary": "#17a2b8",
            "background": "#ffffff",
            "text": "#212529",
            "accent": "#ffc107",
            "surface": "#f8f9fa",
            "border": "#dee2e6"
        },
        {
            "primary": "#dc3545",
            "secondary": "#6c757d",
            "background": "#ffffff",
            "text": "#212529",
            "accent": "#fd7e14",
            "surface": "#f8f9fa",
            "border": "#dee2e6"
        }
    ]
    
    @staticmethod
    def generate_landing(prompt: str, categories: List[str] = None) -> GenerateLandingResponse:
        """
        Генерирует лендинг на основе промпта
        
        Args:
            prompt: Описание лендинга
            categories: Список категорий блоков
            
        Returns:
            GenerateLandingResponse с блоками и палитрой
        """
        # Выбираем случайное количество блоков (3-5)
        num_blocks = random.randint(3, 5)
        
        # Выбираем случайные блоки из шаблонов
        selected_blocks = random.sample(MockLLMGenerator.BLOCK_TEMPLATES, min(num_blocks, len(MockLLMGenerator.BLOCK_TEMPLATES)))
        
        # Копируем блоки и обновляем ID
        blocks = []
        for i, template in enumerate(selected_blocks):
            block = template.copy()
            block["id"] = f"{block['type']}-{i+1}"
            blocks.append(block)
        
        # Выбираем случайную палитру
        palette_data = random.choice(MockLLMGenerator.PALETTES)
        palette = PaletteSchema(**palette_data)
        
        # Метаданные
        meta = {
            "model": "mock-llm-v1.0",
            "prompt": prompt,
            "categories": categories or [],
            "blocks_count": len(blocks),
            "generated_at": "2024-01-01T00:00:00Z"
        }
        
        return GenerateLandingResponse(
            blocks=blocks,
            palette=palette,
            meta=meta
        )

class LLMGenerator:
    """Обёртка над генераторами лендингов: Gemini (если настроен) или моковый генератор."""
    
    @staticmethod
    def generate_landing(
        prompt: str,
        categories: Optional[List[str]] = None,
    ) -> GenerateLandingResponse:
        # Если ключ Gemini не настроен — сразу используем моковый генератор
        if not settings.GEMINI_API_KEY:
            return MockLLMGenerator.generate_landing(prompt, categories or [])
        
        # Пробуем использовать реальный Gemini-генератор
        from app.services.gemini_landing_generator import GeminiLLMGenerator  # локальный импорт, чтобы избежать циклов
        return GeminiLLMGenerator.generate_landing(prompt, categories or [])

