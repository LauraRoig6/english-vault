const ALLOWED_TYPES = ['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type','word','meaning','spanish','pronunciation_easy','example','my_example','register','level','variety','topic','tags','synonyms','antonyms','related','word_class','word_family','typical_collocations','frequency','naturalness_score','naturalness_label','native_alternative','useful_for_exams','register_ladder','my_mistakes','personal_difficulty','confidence','why_useful','false_friend','etymology','variety_usage','collocation_mistake','sounds_better_as','semantic_field','personal_note','pattern_structure','confused_with','mini_contrast','best_for','avoid_overusing','usage_warning',
    'separable','transitive','similar_expressions','how_common','offensive_warning','slang_tags','trick_category','rule','explanation',
    'examples_list','exceptions','memory_trick','common_mistakes','notes'
  ],
  properties: {
    type: { type: 'string', enum: ALLOWED_TYPES },
    word: { type: 'string' }, meaning: { type: 'string' }, spanish: { type: 'string' }, pronunciation_easy: { type: 'string' }, example: { type: 'string' }, my_example: { type: 'string' },
    register: { type: 'string', enum: ['', 'Formal', 'Neutral', 'Informal', 'Slang'] },
    level: { type: 'string', enum: ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'] },
    variety: { type: 'string', enum: ['', 'British English', 'American English', 'Both'] },
    topic: { type: 'string' }, tags: { type: 'string' }, synonyms: { type: 'string' }, antonyms: { type: 'string' }, related: { type: 'string' }, word_class: { type: 'string' },
    word_family: { type: 'string' }, typical_collocations: { type: 'string' }, frequency: { type: 'string' }, naturalness_score: { type: 'integer', minimum: 1, maximum: 5 }, naturalness_label: { type: 'string' }, native_alternative: { type: 'string' }, useful_for_exams: { type: 'string' }, register_ladder: { type: 'string' }, my_mistakes: { type: 'string' }, personal_difficulty: { type: 'string' }, confidence: { type: 'string' }, why_useful: { type: 'string' }, false_friend: { type: 'string' }, etymology: { type: 'string' }, variety_usage: { type: 'string' }, collocation_mistake: { type: 'string' }, sounds_better_as: { type: 'string' }, semantic_field: { type: 'string' }, personal_note: { type: 'string' },
    pattern_structure: { type: 'string' }, confused_with: { type: 'string' }, mini_contrast: { type: 'string' }, best_for: { type: 'string' }, avoid_overusing: { type: 'string' }, usage_warning: { type: 'string' },
    separable: { type: 'string' }, transitive: { type: 'string' }, similar_expressions: { type: 'string' }, how_common: { type: 'string' },
    offensive_warning: { type: 'string' }, slang_tags: { type: 'string' }, trick_category: { type: 'string' }, rule: { type: 'string' },
    explanation: { type: 'string' }, examples_list: { type: 'string' }, exceptions: { type: 'string' }, memory_trick: { type: 'string' },
    common_mistakes: { type: 'string' }, notes: { type: 'string' }
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in Vercel.' });

  const rawWord = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  const typeHint = typeof req.body?.type === 'string' ? req.body.type.trim() : '';
  if (!rawWord || rawWord.length > 160) return res.status(400).json({ error: 'Enter a word, expression or grammar point first.' });

  const instructions = `You fill entries for a personal English-learning app called English Vault. Use natural, accurate modern English and useful Spanish translations. Prefer British English spelling when there is no reason to prefer American English. Infer the most useful category from these exact options: ${ALLOWED_TYPES.join(', ')}. The user's current type selection is only a hint and may be wrong. Use concise but pedagogically useful content. For fields irrelevant to the chosen category, return an empty string. Always return word in lower case, preserving normal punctuation and apostrophes.

EASY PRONUNCIATION: for ordinary lexical entries, give a learner-friendly pronunciation written approximately "as a Spanish speaker would read it", between slashes, NOT IPA. Use Spanish-looking spelling and an accent mark when useful to show stress, e.g. schedule could be approximately /shédiul/ in British English. If British and American pronunciation differ meaningfully, you may write "UK: /.../ · US: /.../". Keep it short. Leave blank for Grammar / Trick.

Populate word_family only with useful members of the same lexical family, as short comma-separated items. Populate typical_collocations with 2-5 natural collocations, short comma-separated items. Populate pattern_structure when there is a useful grammatical pattern, complement or construction. BEST FOR should be a very short usage label such as "formal writing", "conversation", "both writing and speaking", or a similarly useful combination. AVOID OVERUSING should be a short naturalness warning only when the item is marked/formal/rare/easy to overuse; otherwise return an empty string.

Populate confused_with ONLY when there is a genuinely confusable word or expression that learners actually mix up with the target because of similar form, meaning, translation, or usage. NEVER put a mere synonym, related phrase, thematic neighbour, or explanation there. If there is no genuine confusion pair, return an empty string. MINI CONTRAST is allowed only when confused_with is non-empty or there is one especially useful near-synonym contrast; keep it to one concise sentence.

SYNONYMS, ANTONYMS, RELATED EXPRESSIONS, WORD FAMILY, TYPICAL COLLOCATIONS, CONFUSED WITH and RELATED PHRASAL VERBS must contain ONLY short standalone lexical items separated by commas: no definitions, no explanations, no colons, no semicolons, no full sentences. Use at most 5 items in each list.



CLASSIFICATION: Use Verb for ordinary lexical verbs such as "to blare", "to ponder" or "to dwindle". Keep Phrasal Verb for verb + particle combinations such as "put off". Use Vocabulary primarily for nouns, adjectives and adverbs; populate WORD CLASS for Vocabulary with Noun, Adjective, Adverb or Other. For Verb, keep word_class blank.

FREQUENCY: choose one concise label: Very common, Common, Less common, or Rare.
NATURALNESS SCORE: rate how idiomatic/natural the target sounds in normal modern English from 1 to 5, where 5 = very natural/idiomatic and 1 = awkward or normally avoided. This is NOT the same as formality. NATURALNESS LABEL should be one short useful explanation such as "Very natural in everyday speech", "Natural, but mainly in formal writing", or "Correct but rather literary".
NATIVE ALTERNATIVE: only when a more usual or more natural alternative would genuinely help; otherwise blank.
USEFUL FOR EXAMS: short labels such as "Essay", "Speaking", "CAE/C1", "Formal writing", separated by commas; blank if not especially useful.
REGISTER LADDER: when useful, show a short progression from informal to neutral to formal, e.g. "kids → children → youngsters"; otherwise blank.
WHY IS THIS USEFUL?: one concise learner-focused reason to remember the item.
FALSE FRIEND: only populate for a real Spanish-English false friend or especially dangerous translation trap; otherwise blank.
ETYMOLOGY / ORIGIN: give one short memorable origin only when reasonably established and useful; otherwise blank.
BRITISH VS AMERICAN USAGE: explain a real UK/US difference in wording, pronunciation or frequency only when meaningful; otherwise blank.
COMMON COLLOCATION MISTAKE: give one concise wrong→right collocation trap when useful; otherwise blank.
SOUNDS BETTER AS: when a learner is likely to produce a technically possible but less natural version, give one more idiomatic alternative; otherwise blank.
SEMANTIC FIELD: one short thematic label such as confusion, agreement, anger, movement, academic writing.
PERSONAL NOTE belongs to the learner, so ALWAYS return it as an empty string.
MY MISTAKES, PERSONAL DIFFICULTY and CONFIDENCE belong to the learner, so ALWAYS return them as empty strings.

Populate usage_warning whenever register, grammar, connotation, countability, collocation or context could cause a learner mistake. COMMON MISTAKES MUST be non-empty for every non-Grammar/Trick entry: give 1-2 concise, specific learner mistakes or usage traps. For idioms, include a literal-translation/fixed-expression trap when relevant. For connectors, mention punctuation/position/register if useful. For vocabulary, mention a realistic collocation, meaning, register, countability, preposition or false-friend trap. Never invent an unrelated comparison merely to fill it. Never use em dashes as placeholders.

For Grammar / Trick, fully populate trick_category, rule, explanation, examples_list, exceptions, memory_trick and common_mistakes. For Phrasal Verb, populate separable, transitive and similar_expressions. For Slang, populate how_common, usage_warning and slang_tags. Keep offensive_warning empty unless it is needed for backward compatibility. For Connector / Linker, make the function in discourse clear. Do not invent a MY EXAMPLE for the learner: my_example must be an empty string.`

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        reasoning: { effort: 'none' },
        input: [
          { role: 'system', content: [{ type: 'input_text', text: instructions }] },
          { role: 'user', content: [{ type: 'input_text', text: `WORD / EXPRESSION: ${rawWord}\nCURRENT TYPE HINT: ${typeHint || 'none'}` }] }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'english_vault_entry',
            strict: true,
            schema
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI error', data);
      return res.status(response.status).json({ error: data?.error?.message || 'OpenAI request failed.' });
    }

    let output = data.output_text;
    if (!output && Array.isArray(data.output)) {
      for (const item of data.output) {
        for (const c of item?.content || []) {
          if (c?.type === 'output_text' && c.text) output = c.text;
        }
      }
    }
    if (!output) return res.status(502).json({ error: 'The AI returned no usable content.' });

    const entry = JSON.parse(output);
    entry.word = String(entry.word || rawWord).trim().toLowerCase();
    const cleanLexicalList = (value) => String(value || '')
      .split(/[,;\n]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => x.includes(':') ? x.split(':')[0].trim() : x)
      .filter((x) => x && !/^(or|and|because|which|this|that)\b/i.test(x))
      .filter((x) => x.split(/\s+/).length <= 8)
      .slice(0, 5)
      .join(', ');
    entry.synonyms = cleanLexicalList(entry.synonyms);
    entry.related = cleanLexicalList(entry.related);
    entry.antonyms = cleanLexicalList(entry.antonyms);
    entry.word_family = cleanLexicalList(entry.word_family);
    entry.typical_collocations = cleanLexicalList(entry.typical_collocations);
    entry.confused_with = cleanLexicalList(entry.confused_with);
    entry.similar_expressions = cleanLexicalList(entry.similar_expressions);
    if (!String(entry.common_mistakes || '').trim()) {
      if (entry.type === 'Idiom') entry.common_mistakes = 'Do not translate or interpret it literally; use it as a fixed idiomatic expression.';
      else if (entry.type === 'Connector / Linker') entry.common_mistakes = 'Check its sentence position, punctuation and register instead of using it as a direct replacement for every contrast linker.';
      else if (entry.type === 'Phrasal Verb') entry.common_mistakes = 'Check whether it is separable and whether it needs an object before changing the word order.';
      else if (entry.type !== 'Grammar / Trick') entry.common_mistakes = 'Avoid using it only from a literal Spanish translation; check the usual context, collocations and register.';
    }
    return res.status(200).json(entry);
  } catch (err) {
    console.error('Autofill exception', err);
    return res.status(500).json({ error: err?.message || 'Could not generate the entry.' });
  }
}
