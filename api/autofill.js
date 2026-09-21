const ALLOWED_TYPES = ['Vocabulary', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type','word','meaning','spanish','example','my_example','register','level','variety','topic','tags','synonyms','related','pattern_structure','confused_with','usage_warning',
    'separable','transitive','similar_expressions','how_common','offensive_warning','slang_tags','trick_category','rule','explanation',
    'examples_list','exceptions','memory_trick','common_mistakes','notes'
  ],
  properties: {
    type: { type: 'string', enum: ALLOWED_TYPES },
    word: { type: 'string' }, meaning: { type: 'string' }, spanish: { type: 'string' }, example: { type: 'string' }, my_example: { type: 'string' },
    register: { type: 'string', enum: ['', 'Formal', 'Neutral', 'Informal', 'Slang'] },
    level: { type: 'string', enum: ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'] },
    variety: { type: 'string', enum: ['', 'British English', 'American English', 'Both'] },
    topic: { type: 'string' }, tags: { type: 'string' }, synonyms: { type: 'string' }, related: { type: 'string' },
    pattern_structure: { type: 'string' }, confused_with: { type: 'string' }, usage_warning: { type: 'string' },
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

  const instructions = `You fill entries for a personal English-learning app called English Vault. Use natural, accurate modern English and useful Spanish translations. Prefer British English spelling when there is no reason to prefer American English. Infer the most useful category from these exact options: ${ALLOWED_TYPES.join(', ')}. The user's current type selection is only a hint and may be wrong. Use concise but pedagogically useful content. For fields irrelevant to the chosen category, return an empty string. Populate pattern_structure when there is a useful grammatical pattern, complement or construction. Populate confused_with only when there is a genuinely useful commonly confused item. Populate usage_warning whenever register, grammar, connotation, countability, collocation or context could cause a learner mistake. Never use em dashes as placeholders. For Grammar / Trick, fully populate trick_category, rule, explanation, examples_list, exceptions, memory_trick and common_mistakes. For Phrasal Verb, populate separable, transitive and similar_expressions. For Slang, populate how_common, usage_warning and slang_tags. Keep offensive_warning empty unless it is needed for backward compatibility. For Connector / Linker, make the function in discourse clear. Do not invent a MY EXAMPLE for the learner: my_example must be an empty string.`;

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
    entry.word = entry.word || rawWord;
    return res.status(200).json(entry);
  } catch (err) {
    console.error('Autofill exception', err);
    return res.status(500).json({ error: err?.message || 'Could not generate the entry.' });
  }
}
