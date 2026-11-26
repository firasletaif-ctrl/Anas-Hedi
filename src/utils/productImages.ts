export function parseProductImages(imageField?: string): string[] {
  if (!imageField) return [];
  const trimmed = imageField.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string' && x.length > 0);
    } catch {
      // fallback
    }
  }
  return [trimmed];
}

export function serializeProductImages(images: string[]): string {
  const clean = images.filter((x) => x && x.trim().length > 0);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}
