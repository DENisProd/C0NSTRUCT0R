from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from .config import settings
from .schemas import GenerateRequest, GenerateResponse, SiteTemplate, Meta, Section, TextBlock, ImageBlock, ButtonBlock
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .utils.ollama_client import OllamaClient

app = FastAPI(title="ML Site Template Generator", default_response_class=ORJSONResponse)

# Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=[settings.cors_allow_methods] if settings.cors_allow_methods != "*" else ["*"],
    allow_headers=[settings.cors_allow_headers] if settings.cors_allow_headers != "*" else ["*"],
)

client = OllamaClient(base_url=settings.ollama_base_url, model=settings.ollama_model, timeout=settings.ollama_timeout)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/schema")
def schema():
    return {
        "version": "1.0",
        "meta": {
            "title": "string",
            "description": "string",
            "keywords": ["string"],
            "theme": "light|dark",
            "palette": {"primary": "#RRGGBB", "accent": "#RRGGBB"}
        },
        "layout": [
            {"type": "hero|features|about|gallery|pricing|cta|footer|custom",
             "title": "string?",
             "subtitle": "string?",
             "blocks": [
                {"type": "text", "text": "string", "size": "xs|sm|md|lg|xl", "align": "left|center|right"},
                {"type": "image", "url": "string", "alt": "string?", "width": "string?", "height": "string?"},
                {"type": "button", "text": "string", "href": "string", "variant": "primary|secondary|outline|link"}
             ]}
        ]
    }

@app.post("/api/v1/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    try:
        user_prompt = build_user_prompt(req.query, req.language or "ru", req.theme or "light", req.brand_colors)
        raw = await client.generate_json(system=SYSTEM_PROMPT, user=user_prompt)
        # Validate with Pydantic to guarantee the schema
        template = SiteTemplate.model_validate(raw)
        return GenerateResponse(template=template, raw=raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
