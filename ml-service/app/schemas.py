from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional, Dict, Any

# ----- Input -----
class GenerateRequest(BaseModel):
    query: str = Field(..., description="User prompt, e.g. 'сайт пиво'")
    language: Optional[str] = Field(default="ru", description="Content language, ru or en")
    theme: Optional[Literal["light", "dark"]] = "light"
    brand_colors: Optional[Dict[str, str]] = None  # {"primary": "#...", "accent": "#..."}
    seed: Optional[int] = None

# ----- Template Schema -----
class TextBlock(BaseModel):
    type: Literal["text"]
    text: str
    size: Optional[Literal["xs","sm","md","lg","xl"]] = "md"
    align: Optional[Literal["left","center","right"]] = "left"

class ImageBlock(BaseModel):
    type: Literal["image"]
    url: str
    alt: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None

class ButtonBlock(BaseModel):
    type: Literal["button"]
    text: str
    href: str
    variant: Optional[Literal["primary","secondary","outline","link"]] = "primary"

Block = TextBlock | ImageBlock | ButtonBlock

class Section(BaseModel):
    type: Literal["hero","features","about","gallery","pricing","cta","footer","custom"]
    title: Optional[str] = None
    subtitle: Optional[str] = None
    blocks: List[Block] = Field(default_factory=list)

class Meta(BaseModel):
    title: str
    description: str
    keywords: List[str] = Field(default_factory=list)
    theme: Literal["light","dark"] = "light"
    palette: Dict[str, str] = Field(default_factory=dict)  # e.g. {"primary":"#0077ff", "accent":"#ffcc00"}

class SiteTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    version: str = "1.0"
    meta: Meta
    layout: List[Section] = Field(min_length=1)

class GenerateResponse(BaseModel):
    template: SiteTemplate
    raw: dict | None = None
