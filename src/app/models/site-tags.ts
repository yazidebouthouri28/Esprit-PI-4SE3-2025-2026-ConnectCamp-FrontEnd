export const MAX_SITE_TAGS = 5;

export const SITE_TAG_OPTIONS = [
  'Forest',
  'Mountain',
  'Beach',
  'Desert',
  'Lake View',
  'River Access',
  'Waterfall Nearby',
  'Hiking Trails',
  'Campfire',
  'Stargazing',
  'Sunrise Spot',
  'Sunset Views',
  'Adventure',
  'Quiet Escape',
  'Family Friendly',
  'Pet Friendly',
  'Group Friendly',
  'Eco Friendly',
  'Glamping',
  'Photography',
  'Fishing',
  'BBQ Area',
  'Off Grid',
  'Wellness'
] as const;

const siteTagLookup = new Map<string, string>(
  SITE_TAG_OPTIONS.map((tag) => [tag.toLowerCase(), tag])
);

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeSiteTags(tags?: readonly string[] | null, maxTags: number = MAX_SITE_TAGS): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of tags ?? []) {
    const trimmed = String(rawTag ?? '').trim();
    if (!trimmed) {
      continue;
    }

    const canonicalTag = siteTagLookup.get(trimmed.toLowerCase()) ?? toTitleCase(trimmed);
    const key = canonicalTag.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(canonicalTag);

    if (normalized.length >= maxTags) {
      break;
    }
  }

  return normalized;
}
