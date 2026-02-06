// Base44 Cloud Function
// name: classifyServicesBatch
// SAFETY FIXES:
// - Default overwrite=false (prevents wiping existing categories by mistake)
// - game_topup overwrite requires confirmOverwrite=true
// - Stronger matching (word-boundary + optional minKeywordHits)
// - Option onlyIfEmpty=true to only classify unclassified services

function normalize(v: any): string {
  return (v ?? '').toString().toLowerCase().trim();
}

function tokenize(hay: string): Set<string> {
  // كلمات فقط: حروف/أرقام + underscore
  const tokens = (hay || '')
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);
  return new Set(tokens);
}

function isBroadKeyword(k: string): boolean {
  // كلمات عامة خطرة (تسبب تصنيف جماعي)
  const broad = new Set([
    'game', 'games', 'topup', 'top-up', 'top', 'up',
    'credit', 'credits', 'service', 'services',
    'unlock', 'tool', 'tools', 'activation'
  ]);
  if (!k) return true;
  if (k.length <= 3) return true;        // قصير جدًا
  if (broad.has(k)) return true;         // معروف إنه عام
  return false;
}

function keywordHitCount(hay: string, tokens: Set<string>, keywords: string[]): number {
  let hits = 0;

  for (const raw of keywords) {
    const k = normalize(raw);
    if (!k) continue;

    // لو الكلمة broad نخليها word match فقط
    if (isBroadKeyword(k)) {
      if (tokens.has(k)) hits += 1;
      continue;
    }

    // غير broad: substring match (يدعم عبارات مثل "google play")
    if (hay.includes(k)) hits += 1;
  }

  return hits;
}

export default async function classifyServicesBatch(inputs: any, context: any) {
  const {
    category,
    batchSize = 50,
    delayMs = 3000,
    skip = 0,

    // ✅ safer defaults
    overwrite = false,

    // ✅ extra safety switches
    confirmOverwrite = false,   // مطلوب لـ game_topup overwrite
    onlyIfEmpty = false,        // لو true: ما يلمس إلا الخدمات اللي category فارغ
    minKeywordHits = 1,         // خليها 2 إذا تحب تشدد التصنيف (خصوصًا game_topup)
  } = inputs || {};

  if (!category) throw new Error('category is required');

  // ✅ حماية: game_topup + overwrite ممنوع بدون تأكيد صريح
  if (category === 'game_topup' && overwrite && !confirmOverwrite) {
    return {
      matched: 0,
      updated: 0,
      skipped: 0,
      has_more: false,
      last_service_id: skip,
      next_delay_ms: delayMs,
      errors: [{ error: 'Blocked: game_topup overwrite requires confirmOverwrite=true' }],
    };
  }

  const keywords = await context.entities.ServiceKeyword.filter(
    { category },
    '-priority',
    500
  );

  const keywordList: string[] = (keywords || [])
    .map((k: any) => normalize(k.keyword))
    .filter(Boolean);

  if (keywordList.length === 0) {
    return {
      matched: 0,
      updated: 0,
      skipped: 0,
      has_more: false,
      last_service_id: skip,
      next_delay_ms: delayMs,
      errors: [{ error: 'No keywords for this category' }],
    };
  }

  // ✅ IMPORTANT: pagination by offset (skip)
  const services = await context.asServiceRole.entities.Service.filter(
    { is_active: true },
    'created_date',
    batchSize,
    skip
  );

  let matched = 0;
  let updated = 0;
  let skipped = 0;
  const errors: any[] = [];

  for (const srv of services || []) {
    try {
      const currentCat = normalize((srv as any)?.category);
      const isEmptyCat = !currentCat;

      // ✅ onlyIfEmpty wins (حتى لو overwrite true)
      if (onlyIfEmpty && !isEmptyCat) {
        skipped += 1;
        continue;
      }

      // ✅ overwrite false: لا تلمس خدمة مصنفة
      if (!overwrite && !isEmptyCat) {
        skipped += 1;
        continue;
      }

      const hay = `${normalize(srv?.name)} ${normalize(srv?.description)}`;
      const tokens = tokenize(hay);

      const hits = keywordHitCount(hay, tokens, keywordList);

      // ✅ لازم يحقق حد أدنى من التطابق
      if (hits < Math.max(1, Number(minKeywordHits) || 1)) {
        skipped += 1;
        continue;
      }

      matched += 1;

      // إذا نفس التصنيف، لا داعي للتحديث
      if (currentCat === normalize(category)) {
        skipped += 1;
        continue;
      }

      await context.asServiceRole.entities.Service.update(srv.id, { category });
      updated += 1;

    } catch (e: any) {
      skipped += 1;
      errors.push({
        service_id: srv?.id,
        service_name: srv?.name,
        error: e?.message || String(e),
      });
    }
  }

  const has_more = (services || []).length === batchSize;
  const last_service_id = skip + (services || []).length;

  return {
    matched,
    updated,
    skipped,
    has_more,
    last_service_id,
    next_delay_ms: delayMs,
    errors,
  };
}
