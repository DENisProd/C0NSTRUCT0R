"""
Скрипт для инициализации базы данных системными блоками
"""
import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base, async_session_maker, engine
from app.models.block import Block
from app.models.palette import Palette
from app.services.palette_generator import PaletteGenerator


async def init_system_blocks(session: AsyncSession):
    """Инициализирует системные блоки в БД"""
    try:
        # Проверяем, есть ли уже системные блоки (без раннего возврата)
        # Будем добавлять недостающие блоки, избегая дубликатов по имени
        
        # Системные блоки
        system_blocks = [
            {
                "name": "Hero Section",
                "description": "Главный блок с заголовком и кнопкой",
                "category": "hero",
                "tags": ["hero", "header", "cta"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "hero-text",
                        "type": "text",
                        "content": "Добро пожаловать!",
                        "style": {
                            "fontSize": "48px",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "color": "#212529",
                            "margin": "40px 0 20px"
                        }
                    },
                    {
                        "id": "hero-button",
                        "type": "button",
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
                    }
                ]
            },
            {
                "name": "Features Grid",
                "description": "Сетка с преимуществами",
                "category": "features",
                "tags": ["features", "grid", "benefits"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "features-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "feature-1",
                                "type": "text",
                                "content": "Преимущество 1",
                                "style": {
                                    "fontSize": "20px",
                                    "fontWeight": "bold",
                                    "textAlign": "center"
                                }
                            },
                            {
                                "id": "feature-2",
                                "type": "text",
                                "content": "Преимущество 2",
                                "style": {
                                    "fontSize": "20px",
                                    "fontWeight": "bold",
                                    "textAlign": "center"
                                }
                            }
                        ],
                        "style": {
                            "padding": "40px",
                            "backgroundColor": "#f8f9fa",
                            "borderRadius": "8px"
                        }
                    }
                ]
            },
            {
                "name": "Text Block",
                "description": "Простой текстовый блок",
                "category": "content",
                "tags": ["text", "content"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "text-block",
                        "type": "text",
                        "content": "Текст блока",
                        "style": {
                            "fontSize": "16px",
                            "lineHeight": "1.6",
                            "color": "#212529",
                            "margin": "20px 0"
                        }
                    }
                ]
            },
            {
                "name": "Image Block",
                "description": "Блок с изображением",
                "category": "media",
                "tags": ["image", "media"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "image-block",
                        "type": "image",
                        "url": "https://via.placeholder.com/800x400",
                        "style": {
                            "width": "100%",
                            "maxWidth": "800px",
                            "margin": "20px auto",
                            "display": "block",
                            "borderRadius": "8px"
                        }
                    }
                ]
            },
            {
                "name": "Call to Action",
                "description": "Блок призыва к действию",
                "category": "cta",
                "tags": ["cta", "button", "action"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "cta-text",
                        "type": "text",
                        "content": "Готовы начать?",
                        "style": {
                            "fontSize": "32px",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "margin": "20px 0"
                        }
                    },
                    {
                        "id": "cta-button",
                        "type": "button",
                        "text": "Связаться с нами",
                        "link": "#contact",
                        "style": {
                            "padding": "14px 28px",
                            "borderRadius": "8px",
                            "backgroundColor": "#28a745",
                            "color": "#ffffff",
                            "margin": "20px auto",
                            "display": "block",
                            "fontSize": "18px"
                        }
                    }
                ]
            }
        ,
            {
                "name": "Testimonials",
                "description": "Отзывы клиентов",
                "category": "testimonials",
                "tags": ["testimonials", "social-proof"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "testimonials-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "testimonial-title",
                                "type": "text",
                                "content": "Что говорят наши клиенты",
                                "style": {
                                    "fontSize": "28px",
                                    "fontWeight": "bold",
                                    "textAlign": "center",
                                    "margin": "0 0 20px"
                                }
                            },
                            {
                                "id": "testimonial-1",
                                "type": "text",
                                "content": "\"Отличный сервис и качественная поддержка!\"",
                                "style": {
                                    "fontSize": "18px",
                                    "textAlign": "center",
                                    "color": "#555555",
                                    "margin": "10px 0"
                                }
                            },
                            {
                                "id": "testimonial-2",
                                "type": "text",
                                "content": "\"Быстрая интеграция, все работает как часы.\"",
                                "style": {
                                    "fontSize": "18px",
                                    "textAlign": "center",
                                    "color": "#555555",
                                    "margin": "10px 0"
                                }
                            }
                        ],
                        "style": {
                            "padding": "40px",
                            "backgroundColor": "#f8f9fa",
                            "borderRadius": "8px"
                        }
                    }
                ]
            },
            {
                "name": "Pricing",
                "description": "Цены и тарифы",
                "category": "pricing",
                "tags": ["pricing", "plans"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "pricing-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "pricing-title",
                                "type": "text",
                                "content": "Тарифные планы",
                                "style": {
                                    "fontSize": "28px",
                                    "fontWeight": "bold",
                                    "textAlign": "center",
                                    "margin": "0 0 20px"
                                }
                            },
                            {
                                "id": "pricing-basic",
                                "type": "text",
                                "content": "Базовый — 0 ₽",
                                "style": {"textAlign": "center", "margin": "10px 0"}
                            },
                            {
                                "id": "pricing-pro",
                                "type": "text",
                                "content": "Pro — 990 ₽/мес",
                                "style": {"textAlign": "center", "margin": "10px 0"}
                            },
                            {
                                "id": "pricing-enterprise",
                                "type": "text",
                                "content": "Enterprise — по запросу",
                                "style": {"textAlign": "center", "margin": "10px 0"}
                            }
                        ],
                        "style": {
                            "padding": "40px",
                            "backgroundColor": "#ffffff",
                            "borderRadius": "8px",
                            "border": "1px solid #e9ecef"
                        }
                    }
                ]
            },
            {
                "name": "FAQ",
                "description": "Часто задаваемые вопросы",
                "category": "faq",
                "tags": ["faq", "questions"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "faq-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "faq-title",
                                "type": "text",
                                "content": "FAQ",
                                "style": {
                                    "fontSize": "28px",
                                    "fontWeight": "bold",
                                    "textAlign": "center",
                                    "margin": "0 0 20px"
                                }
                            },
                            {
                                "id": "faq-q1",
                                "type": "text",
                                "content": "Как начать работу?",
                                "style": {"fontWeight": "bold", "margin": "10px 0 0"}
                            },
                            {
                                "id": "faq-a1",
                                "type": "text",
                                "content": "Зарегистрируйтесь и создайте первый проект.",
                                "style": {"margin": "0 0 10px"}
                            },
                            {
                                "id": "faq-q2",
                                "type": "text",
                                "content": "Можно ли импортировать свои блоки?",
                                "style": {"fontWeight": "bold", "margin": "10px 0 0"}
                            },
                            {
                                "id": "faq-a2",
                                "type": "text",
                                "content": "Да, через раздел библиотека.",
                                "style": {"margin": "0 0 10px"}
                            }
                        ],
                        "style": {"padding": "30px", "backgroundColor": "#f8f9fa", "borderRadius": "8px"}
                    }
                ]
            },
            {
                "name": "Footer",
                "description": "Нижний колонтитул",
                "category": "footer",
                "tags": ["footer", "links"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "footer-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "footer-text",
                                "type": "text",
                                "content": "© 2025 Компания",
                                "style": {"textAlign": "center", "color": "#6c757d"}
                            }
                        ],
                        "style": {"padding": "20px", "backgroundColor": "#f1f3f5"}
                    }
                ]
            },
            {
                "name": "Header",
                "description": "Верхняя навигация",
                "category": "header",
                "tags": ["header", "navigation"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "header-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "header-title",
                                "type": "text",
                                "content": "Название сайта",
                                "style": {"fontSize": "20px", "fontWeight": "bold"}
                            },
                            {
                                "id": "header-btn-1",
                                "type": "button",
                                "text": "Продукт",
                                "link": "#product",
                                "style": {"margin": "0 10px"}
                            },
                            {
                                "id": "header-btn-2",
                                "type": "button",
                                "text": "Контакты",
                                "link": "#contact",
                                "style": {"margin": "0 10px"}
                            }
                        ],
                        "style": {"padding": "10px 20px", "backgroundColor": "#ffffff", "border": "1px solid #e9ecef"}
                    }
                ]
            },
            {
                "name": "Contact",
                "description": "Контактный блок",
                "category": "contact",
                "tags": ["contact", "cta"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "contact-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "contact-title",
                                "type": "text",
                                "content": "Свяжитесь с нами",
                                "style": {"fontSize": "28px", "fontWeight": "bold", "textAlign": "center"}
                            },
                            {
                                "id": "contact-button",
                                "type": "button",
                                "text": "Написать",
                                "link": "mailto:info@example.com",
                                "style": {"display": "block", "margin": "20px auto"}
                            }
                        ],
                        "style": {"padding": "30px", "backgroundColor": "#ffffff", "border": "1px solid #e9ecef", "borderRadius": "8px"}
                    }
                ]
            },
            {
                "name": "Gallery",
                "description": "Галерея изображений",
                "category": "gallery",
                "tags": ["gallery", "images"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "gallery-container",
                        "type": "container",
                        "children": [
                            {
                                "id": "gallery-img-1",
                                "type": "image",
                                "url": "https://via.placeholder.com/300x200",
                                "style": {"margin": "10px", "borderRadius": "6px"}
                            },
                            {
                                "id": "gallery-img-2",
                                "type": "image",
                                "url": "https://via.placeholder.com/300x200",
                                "style": {"margin": "10px", "borderRadius": "6px"}
                            },
                            {
                                "id": "gallery-img-3",
                                "type": "image",
                                "url": "https://via.placeholder.com/300x200",
                                "style": {"margin": "10px", "borderRadius": "6px"}
                            }
                        ],
                        "style": {"display": "flex", "justifyContent": "center", "flexWrap": "wrap", "padding": "20px"}
                    }
                ]
            },
            {
                "name": "Video Hero",
                "description": "Видео с заголовком и кнопкой",
                "category": "hero",
                "tags": ["video", "hero"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "video-block",
                        "type": "video",
                        "url": "https://www.w3schools.com/html/mov_bbb.mp4",
                        "style": {"width": "100%", "maxWidth": "800px", "display": "block", "margin": "0 auto", "borderRadius": "8px"}
                    },
                    {
                        "id": "video-cta",
                        "type": "button",
                        "text": "Смотреть демо",
                        "link": "#",
                        "style": {"display": "block", "margin": "20px auto"}
                    }
                ]
            },
            {
                "name": "Process",
                "description": "Шаги процесса",
                "category": "process",
                "tags": ["steps", "process"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "process-container",
                        "type": "container",
                        "children": [
                            {"id": "step-1", "type": "text", "content": "Шаг 1: Регистрация", "style": {"margin": "6px 0"}},
                            {"id": "step-2", "type": "text", "content": "Шаг 2: Создание проекта", "style": {"margin": "6px 0"}},
                            {"id": "step-3", "type": "text", "content": "Шаг 3: Публикация", "style": {"margin": "6px 0"}}
                        ],
                        "style": {"padding": "20px", "backgroundColor": "#f8f9fa", "borderRadius": "8px"}
                    }
                ]
            },
            {
                "name": "Newsletter",
                "description": "Подписка на новости",
                "category": "newsletter",
                "tags": ["newsletter", "subscribe"],
                "author": "system",
                "is_custom": False,
                "json_config": [
                    {
                        "id": "newsletter-container",
                        "type": "container",
                        "children": [
                            {"id": "newsletter-title", "type": "text", "content": "Подпишитесь на обновления", "style": {"fontSize": "24px", "textAlign": "center"}},
                            {"id": "newsletter-button", "type": "button", "text": "Подписаться", "link": "#subscribe", "style": {"display": "block", "margin": "10px auto"}}
                        ],
                        "style": {"padding": "20px", "backgroundColor": "#ffffff", "border": "1px solid #e9ecef", "borderRadius": "8px"}
                    }
                ]
            }
        ]
        
        # Добавляем системные блоки, избегая дубликатов по имени
        added_count = 0
        for block_data in system_blocks:
            exists_stmt = select(Block.id).where(
                Block.is_custom.is_(False),
                Block.name == block_data["name"],
            )
            result = await session.execute(exists_stmt)
            if result.scalar_one_or_none():
                continue
            block = Block(**block_data)
            session.add(block)
            added_count += 1
        
        await session.commit()
        if added_count:
            print(f"Добавлено {added_count} новых системных блоков")
        else:
            print("Системные блоки уже инициализированы")
        
    except Exception as e:
        await session.rollback()
        print(f"Ошибка при инициализации: {e}")
        raise


async def init_preset_palettes(session: AsyncSession):
    """Инициализирует предустановленные палитры"""
    try:
        existing_stmt = select(func.count()).select_from(Palette).where(Palette.is_preset.is_(True))
        result = await session.execute(existing_stmt)
        if result.scalar_one() > 0:
            print("Предустановленные палитры уже инициализированы")
            return
        
        preset_data = PaletteGenerator.get_preset_palettes()
        
        for palette_data in preset_data:
            palette = Palette(
                name=palette_data.get("name", "Preset Palette"),
                primary=palette_data["primary"],
                secondary=palette_data.get("secondary"),
                background=palette_data["background"],
                text=palette_data["text"],
                accent=palette_data["accent"],
                surface=palette_data.get("surface"),
                border=palette_data.get("border"),
                is_preset=True,
            )
            session.add(palette)
        
        await session.commit()
        print(f"Инициализировано {len(preset_data)} предустановленных палитр")
        
    except Exception as e:
        await session.rollback()
        print(f"Ошибка при инициализации палитр: {e}")
        raise


if __name__ == "__main__":
    async def main():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with async_session_maker() as session:
            await init_system_blocks(session)
            await init_preset_palettes(session)
        print("Инициализация базы данных завершена!")

    asyncio.run(main())
