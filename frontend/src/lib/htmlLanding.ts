function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function styleObjectToString(style: any): string {
  if (!style) return "";
  return Object.entries(style)
    .map(([key, value]) => `${camelToKebab(key)}:${String(value)}`)
    .join(";");
}

function renderBlock(block: any): string {
  const style = styleObjectToString(block.style || {});
  const type = block.type;

  switch (type) {
    case "text": {
      const content = block.content ?? "";
      return `<div style="${style}">${content}</div>`;
    }
    case "button": {
      const label = block.label || block.content || "Кнопка";
      const href = block.href || "#";
      return `<a href="${href}" style="${style}">${label}</a>`;
    }
    case "image": {
      const src = block.src || block.url || "";
      const alt = block.alt || "";
      if (!src) return "";
      return `<img src="${src}" alt="${alt}" style="${style}" />`;
    }
    case "video": {
      const src = block.src || block.url || "";
      if (!src) return "";
      return `<video src="${src}" style="${style}" controls></video>`;
    }
    case "container":
    case "grid": {
      const children = Array.isArray(block.children) ? block.children : [];
      const innerHtml = children.map((child: any) => renderBlock(child)).join("");
      return `<div style="${style}">${innerHtml}</div>`;
    }
    default: {
      // Фоллбек на JSON, если тип неизвестен
      const content = block.content ?? "";
      if (content) {
        return `<div style="${style}">${content}</div>`;
      }
      return `<div style="${style}">${type}</div>`;
    }
  }
}

/**
 * Собирает полный HTML-документ лендинга из блоков и опциональной палитры.
 */
export function buildLandingHtml(
  blocks: any[],
  palette?: any | null
): string {
  const bgColor =
    palette?.backgroundColor ||
    palette?.background ||
    "#ffffff";
  const textColor =
    palette?.textColor ||
    palette?.text ||
    "#000000";

  const blocksHtml = (blocks || [])
    .map((block: any) => renderBlock(block))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Сгенерированный лендинг</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      color: ${textColor};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
        sans-serif;
    }

    a {
      text-decoration: none;
      cursor: pointer;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    video {
      max-width: 100%;
      display: block;
    }
  </style>
</head>
<body>
  ${blocksHtml}
</body>
</html>`;
}
