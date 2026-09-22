const ALLOWED_TYPES = ['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type','word','meaning','spanish','pronunciation_easy','example','my_example','register','level','variety','topic','tags','synonyms','antonyms','related','word_class','word_family','typical_collocations','frequency','naturalness_score','naturalness_label','native_alternative','useful_for_exams','register_ladder','why_useful','collocation_mistake','semantic_field','pattern_structure','confused_with','mini_contrast','best_for','avoid_overusing','usage_warning',
    'separable','transitive','similar_expressions','how_common','offensive_warning','slang_tags','trick_category','quick_summary','rule','visual_scheme','explanation','choni_explanation',
    'examples_list','exceptions','memory_trick','common_mistakes','notes','simple_explanation','friend_explanation','memory_hook','typical_situation','classification_confidence','classification_note'
  ],
  properties: {
    type: { type: 'string', enum: ALLOWED_TYPES },
    word: { type: 'string' }, meaning: { type: 'string' }, spanish: { type: 'string' }, pronunciation_easy: { type: 'string' }, example: { type: 'string' }, my_example: { type: 'string' },
    register: { type: 'string', enum: ['', 'Formal', 'Neutral', 'Informal', 'Slang'] },
    level: { type: 'string', enum: ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'] },
    variety: { type: 'string', enum: ['', 'British English', 'American English', 'Both'] },
    topic: { type: 'string' }, tags: { type: 'string' }, synonyms: { type: 'string' }, antonyms: { type: 'string' }, related: { type: 'string' }, word_class: { type: 'string' },
    word_family: { type: 'string' }, typical_collocations: { type: 'string' }, frequency: { type: 'string' }, naturalness_score: { type: 'integer', minimum: 1, maximum: 5 }, naturalness_label: { type: 'string' }, native_alternative: { type: 'string' }, useful_for_exams: { type: 'string' }, register_ladder: { type: 'string' }, why_useful: { type: 'string' }, collocation_mistake: { type: 'string' }, semantic_field: { type: 'string' },
    pattern_structure: { type: 'string' }, confused_with: { type: 'string' }, mini_contrast: { type: 'string' }, best_for: { type: 'string' }, avoid_overusing: { type: 'string' }, usage_warning: { type: 'string' },
    separable: { type: 'string' }, transitive: { type: 'string' }, similar_expressions: { type: 'string' }, how_common: { type: 'string' },
    offensive_warning: { type: 'string' }, slang_tags: { type: 'string' }, trick_category: { type: 'string' }, quick_summary: { type: 'string' }, rule: { type: 'string' }, visual_scheme: { type: 'string' },
    explanation: { type: 'string' }, choni_explanation: { type: 'string' }, examples_list: { type: 'string' }, exceptions: { type: 'string' }, memory_trick: { type: 'string' },
    common_mistakes: { type: 'string' }, notes: { type: 'string' },
    simple_explanation: { type: 'string' }, friend_explanation: { type: 'string' }, memory_hook: { type: 'string' }, typical_situation: { type: 'string' },
    classification_confidence: { type: 'string', enum: ['High', 'Needs review'] }, classification_note: { type: 'string' }
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



CLASSIFICATION: Classify by linguistic function, not by how informal or memorable the item feels.
- Vocabulary: primarily a single noun, adjective or adverb (and other standalone lexical items that do not fit a more specific category).
- Verb: an ordinary lexical verb, e.g. "to blare", "to ponder", "to dwindle".
- Phrasal Verb: a lexical verb + particle/preposition functioning as a unit, e.g. "put off", "carry on", "give up". Do NOT use Phrasal Verb for ordinary verb phrases or idioms merely because they contain a verb.
- Collocation: a conventional word partnership whose words largely keep their normal meanings, e.g. "heavy rain", "make a decision", "deeply concerned". A collocation is about habitual co-occurrence, not figurative meaning.
- Slang: distinctly very informal/non-standard or group/period-marked vocabulary, e.g. "skint", "knackered". Do NOT label something Slang merely because it is conversational.
- Idiom: a fixed/semi-fixed expression whose overall meaning is not fully predictable from the literal words, e.g. "sit on the fence", "pull strings".
- Expression: useful multi-word expression that is not better classified as Idiom, Collocation, Phrasal Verb or Connector.
- Connector / Linker: organises discourse or logical relations between clauses/ideas.
- Grammar / Trick: a rule, contrast, mnemonic or usage note rather than a lexical item.
Use Vocabulary primarily for nouns, adjectives and adverbs; populate WORD CLASS for Vocabulary with Noun, Adjective, Adverb or Other. For Verb, keep word_class blank.
Set classification_confidence to "High" when the category is clear. Set it to "Needs review" only when two categories are genuinely plausible, and explain the ambiguity briefly in classification_note. Never use "Needs review" just because the item is rare.

FREQUENCY: choose one concise label: Very common, Common, Less common, or Rare.
NATURALNESS SCORE: rate how idiomatic/natural the target sounds in normal modern English from 1 to 5, where 5 = very natural/idiomatic and 1 = awkward or normally avoided. This is NOT the same as formality. NATURALNESS LABEL should be one short useful explanation such as "Very natural in everyday speech", "Natural, but mainly in formal writing", or "Correct but rather literary".
NATIVE ALTERNATIVE: only when a more usual or more natural alternative would genuinely help; otherwise blank.
USEFUL FOR EXAMS: short labels such as "Essay", "Speaking", "CAE/C1", "Formal writing", separated by commas; blank if not especially useful.
REGISTER LADDER: when useful, show a short progression from informal to neutral to formal, e.g. "kids → children → youngsters"; otherwise blank.
WHY IS THIS USEFUL?: one concise learner-focused reason to remember the item.
COMMON COLLOCATION MISTAKE: give one concise wrong→right collocation trap when useful; otherwise blank.
SEMANTIC FIELD: one short thematic label such as confusion, agreement, anger, movement, academic writing.

Populate usage_warning whenever register, grammar, connotation, countability, collocation or context could cause a learner mistake.
COMMON MISTAKES is displayed in the app as "DON'T SAY THIS". Make it visual and practical whenever possible using **❌** for the wrong/awkward form and **✅** for the natural/correct form. Give 1-2 concise traps. Do not duplicate COMMON COLLOCATION MISTAKE word-for-word.
For idioms, include a literal-translation/fixed-expression trap when relevant. For connectors, mention punctuation/position/register if useful. For vocabulary, mention a realistic collocation, meaning, register, countability, preposition or false-friend trap. Never invent an unrelated comparison merely to fill it. Never use em dashes as placeholders.

For EVERY non-Grammar/Trick lexical entry, populate these study fields automatically:
- simple_explanation: in SPANISH, explain the target in very easy language ("English for dummies" level) while keeping the target English words in English. Use simple Markdown such as **bold** and *italics* when it genuinely helps.
- friend_explanation: in SPANISH, explain it as a clever friend would: colloquial, warm, memorable and a bit playful, but accurate. English examples/target words stay in English. Markdown is allowed.
- memory_hook: one ultra-short memorable line that makes the meaning stick. Spanish may be used, with the English target left in English.
- typical_situation: one short, concrete situation in which a native speaker would naturally use the item.
For Grammar / Trick, leave those four lexical study fields empty because Tricks already have their own choni explanation and memory trick.
NOTES must contain one concise genuinely useful extra note when there is one (for example a fixed preposition, a useful nuance, a common variant or a usage shortcut). Do not silently drop NOTES. If there is no extra note beyond the other fields, return an empty string.

For Grammar / Trick, fully populate trick_category, quick_summary, rule, visual_scheme, explanation, choni_explanation, examples_list, exceptions, memory_trick and common_mistakes. QUICK SUMMARY is one short takeaway. VISUAL SCHEME should be a compact text diagram using arrows (→), short lines or contrasts that the UI can render as visual steps. CHONI EXPLANATION must be in Spanish, funny and memorable in a playful colloquial tone, but pedagogically correct and never vulgar, insulting or misleading. Keep it concise. For Phrasal Verb, populate separable, transitive and similar_expressions. For Slang, populate how_common, usage_warning and slang_tags. Keep offensive_warning empty unless it is needed for backward compatibility. For Connector / Linker, make the function in discourse clear. Do not invent a MY EXAMPLE for the learner: my_example must be an empty string.`

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
      if (entry.type === 'Idiom') entry.common_mistakes = '❌ Literal translation or flexible wording.\n✅ Use it as a fixed idiomatic expression.';
      else if (entry.type === 'Connector / Linker') entry.common_mistakes = '❌ Using it as an interchangeable replacement for every linker.\n✅ Check its normal position, punctuation and register.';
      else if (entry.type === 'Phrasal Verb') entry.common_mistakes = '❌ Changing the word order without checking the pattern.\n✅ Check whether it is separable and whether it needs an object.';
      else if (entry.type !== 'Grammar / Trick') entry.common_mistakes = '❌ Choosing it only from a literal Spanish translation.\n✅ Check the usual context, collocations and register.';
    }
    return res.status(200).json(entry);
  } catch (err) {
    console.error('Autofill exception', err);
    return res.status(500).json({ error: err?.message || 'Could not generate the entry.' });
  }
}
