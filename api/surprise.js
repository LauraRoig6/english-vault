const ALLOWED_TYPES = ['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker'];

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'word', 'teaser', 'spanish', 'example', 'level', 'variety'],
  properties: {
    type: { type: 'string', enum: ALLOWED_TYPES },
    word: { type: 'string' },
    teaser: { type: 'string' },
    spanish: { type: 'string' },
    example: { type: 'string' },
    level: { type: 'string', enum: ['A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'] },
    variety: { type: 'string', enum: ['British English', 'American English', 'Both'] }
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in Vercel.' });

  const exclude = Array.isArray(req.body?.exclude)
    ? req.body.exclude.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 300)
    : [];

  const instructions = `You suggest ONE genuinely useful new English discovery for a personal English-learning app. It must be something an intermediate/advanced learner could realistically want to keep: an interesting vocabulary item, lexical verb, slang item, phrasal verb, expression, collocation, idiom, or connector/linker. Avoid extremely basic words, obscure dictionary curiosities, proper names, offensive content, and anything in the exclusion list. Prefer natural modern English. Prefer British English when variety matters, but return Both when appropriate. The teaser must be short and enticing, not a full dictionary entry. Do not return Grammar / Trick here.`;

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
          { role: 'user', content: [{ type: 'input_text', text: `Already saved / do not suggest:\n${exclude.length ? exclude.join('\n') : '(none yet)'}\n\nSuggest one new discovery now.` }] }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'english_vault_surprise',
            strict: true,
            schema
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI surprise error', data);
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

    const suggestion = JSON.parse(output);
    return res.status(200).json(suggestion);
  } catch (err) {
    console.error('Surprise exception', err);
    return res.status(500).json({ error: err?.message || 'Could not generate a surprise discovery.' });
  }
};
