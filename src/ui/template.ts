type TemplateContext = Record<string, unknown>;

// On purpose because this function shpuld support any javascript object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPath(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

export function escapeHtml(value: unknown): string {
  const s = String(value ?? "");
  return s
    .replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace('"', "&quot;")
    .replace("'", "&#39;");
}

/**
 * Replaces {{key}} or {{a.b.c}} with escaped values from context.
 * Also supports raw HTML via {{{key}}} (optional, careful).
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  // triple mustache = unescaped (optional feature)
  template = template.replace(/\{\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}\}/g, (_, path) => {
    const v = getPath(context, path);
    return String(v ?? "");
  });

  // double mustache = escaped
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
    const v = getPath(context, path);
    return escapeHtml(v);
  });
}
