import { parseFeatures } from "./parseFeatures"

export type FeatureInput = string | string[] | null | undefined

function sanitizeFeature(text: string) {
  const withoutHtml = text.replace(/<[^>]+>/g, " ")
  const collapsed = withoutHtml.replace(/\s+/g, " ").trim()
  return collapsed.slice(0, 160)
}

export function normalizeFeatures(input: FeatureInput, max = 20): string[] {
  if (!input) return []

  const baseArray = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? parseFeatures(input)
      : []

  const cleaned = baseArray
    .map((item) => sanitizeFeature(String(item || "")))
    .filter((item) => item.length > 0)

  return cleaned.slice(0, max)
}

export function getProductFeatures(product: any, max = 20): string[] {
  const direct = normalizeFeatures(product?.features, max)
  if (direct.length) return direct
  return normalizeFeatures(product?.featuresText, max)
}

export function deriveFeaturesPayload(featuresInput: FeatureInput, fallbackText?: string) {
  const features = normalizeFeatures(featuresInput || fallbackText)
  const featuresText =
    typeof fallbackText === "string"
      ? fallbackText
      : Array.isArray(featuresInput)
        ? featuresInput.join("\n")
        : typeof featuresInput === "string"
          ? featuresInput
          : features.join("\n")

  return { features, featuresText }
}
