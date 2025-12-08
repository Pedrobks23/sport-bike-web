export function parseFeatures(input?: string | null): string[] {
  if (!input) return []

  return input
    .split(/\r?\n|;|•/g)
    .map((text) => text.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .map((text) => text.slice(0, 160))
}
