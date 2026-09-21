export function normalizeEntryText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitList(value = '') {
  return String(value)
    .split(/[,;\n]+|\s*≠\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function exactDuplicate(records = [], word = '', excludeId = null) {
  const target = normalizeEntryText(word);
  if (!target) return null;
  return records.find((r) => r.__backendId !== excludeId && normalizeEntryText(r.word) === target) || null;
}

function tokenSet(value = '') {
  return new Set(normalizeEntryText(value).split(' ').filter((x) => x.length > 2));
}

export function relatedScore(a, b) {
  const aw = normalizeEntryText(a?.word || '');
  const bw = normalizeEntryText(b?.word || '');
  if (!aw || !bw || aw === bw) return 0;

  let score = 0;
  const at = tokenSet(aw);
  const bt = tokenSet(bw);
  for (const t of at) if (bt.has(t)) score += 3;

  const aRelated = new Set([
    ...splitList(a?.synonyms), ...splitList(a?.related), ...splitList(a?.confused_with), ...splitList(a?.similar_expressions),
  ].map(normalizeEntryText));
  const bRelated = new Set([
    ...splitList(b?.synonyms), ...splitList(b?.related), ...splitList(b?.confused_with), ...splitList(b?.similar_expressions),
  ].map(normalizeEntryText));

  if (aRelated.has(bw) || bRelated.has(aw)) score += 8;
  if (a.topic && b.topic && normalizeEntryText(a.topic) === normalizeEntryText(b.topic)) score += 2;
  if (a.type && b.type && a.type === b.type) score += 1;

  const aTags = new Set(splitList(a?.tags).map(normalizeEntryText));
  const bTags = new Set(splitList(b?.tags).map(normalizeEntryText));
  for (const t of aTags) if (bTags.has(t)) score += 1;
  return score;
}

export function findSimilarEntries(records = [], draft = {}, excludeId = null, limit = 4) {
  return records
    .filter((r) => r.__backendId !== excludeId)
    .map((r) => ({ record: r, score: relatedScore(draft, r) }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.record);
}

export function isDue(record, now = Date.now()) {
  if (record?.is_known || record?.status === 'Mastered') return false;
  if (!record?.needs_review) return false;
  if (!record?.next_review_at) return true;
  const t = new Date(record.next_review_at).getTime();
  return Number.isFinite(t) ? t <= now : true;
}
