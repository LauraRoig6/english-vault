module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in Vercel.' });

  const mode = req.body?.mode;
  const word = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  const meaning = typeof req.body?.meaning === 'string' ? req.body.meaning.trim() : '';
  const type = typeof req.body?.type === 'string' ? req.body.type.trim() : '';
  if (!word || word.length > 160) return res.status(400).json({ error: 'Missing word or expression.' });
  if (!['contexts', 'spanish', 'compare', 'sentence', 'improve'].includes(mode)) return res.status(400).json({ error: 'Unknown help mode.' });
  const compareWord = typeof req.body?.compare_word === 'string' ? req.body.compare_word.trim() : '';
  const sentence = typeof req.body?.sentence === 'string' ? req.body.sentence.trim() : '';
  const currentRecord = req.body?.record && typeof req.body.record === 'object' ? req.body.record : {};

  const contextSchema = {
    type: 'object', additionalProperties: false,
    required: ['examples'],
    properties: {
      examples: {
        type: 'array', minItems: 3, maxItems: 3,
        items: {
          type: 'object', additionalProperties: false,
          required: ['context', 'sentence', 'why_it_fits'],
          properties: {
            context: { type: 'string', enum: ['Formal', 'Informal', 'Conversation'] },
            sentence: { type: 'string' },
            why_it_fits: { type: 'string' }
          }
        }
      }
    }
  };

  const spanishSchema = {
    type: 'object', additionalProperties: false,
    required: ['explanation', 'nuance', 'memory_tip'],
    properties: {
      explanation: { type: 'string' },
      nuance: { type: 'string' },
      memory_tip: { type: 'string' }
    }
  };

  const compareSchema = {
    type: 'object', additionalProperties: false, required: ['headline','difference','use_first','use_second'],
    properties: { headline:{type:'string'}, difference:{type:'string'}, use_first:{type:'string'}, use_second:{type:'string'} }
  };
  const sentenceSchema = {
    type: 'object', additionalProperties: false, required: ['verdict','feedback','improved_sentence'],
    properties: { verdict:{type:'string'}, feedback:{type:'string'}, improved_sentence:{type:'string'} }
  };
  const improveSchema = {
    type: 'object', additionalProperties: false, required: ['suggestions'],
    properties: { suggestions:{type:'array', minItems:1, maxItems:5, items:{type:'string'}} }
  };

  const isContexts = mode === 'contexts';
  const instructions = mode === 'contexts'
    ? `You are an English teacher helping a Spanish-speaking learner. Generate exactly three natural examples for the target item: one Formal, one Informal, and one Conversation example. Keep the target item unchanged where grammatically possible. Make the contexts genuinely different, not cosmetic rewrites. Add one short explanation in Spanish of why each example fits that register/context.`
    : mode === 'spanish'
      ? `You are an English teacher helping a Spanish-speaking learner. Explain the target English item clearly in Spanish. Be concise but pedagogically useful. Explain the core meaning, the most important nuance or usage distinction, and give a memorable tip. Do not invent obscure claims.`
      : mode === 'compare'
        ? `Compare two English items for a Spanish-speaking learner. Be concise and practical. Explain the real difference in meaning, register, collocation or context. Do not force a distinction if they overlap; say so clearly.`
        : mode === 'sentence'
          ? `Check whether the learner's sentence uses the target English item naturally and correctly. Give a short verdict, explain the key issue in Spanish, and provide a more natural corrected sentence only when useful.`
          : `Audit an English-learning entry. Give 1-5 concise actionable suggestions only when they improve accuracy, naturalness, completeness or usefulness. Do not suggest cosmetic rewrites just for the sake of changing text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        reasoning: { effort: 'none' },
        input: [
          { role: 'system', content: [{ type: 'input_text', text: instructions }] },
          { role: 'user', content: [{ type: 'input_text', text: `TARGET: ${word}\nTYPE: ${type || 'unknown'}\nCURRENT MEANING: ${meaning || 'not provided'}\nCOMPARE WITH: ${compareWord || 'none'}\nLEARNER SENTENCE: ${sentence || 'none'}\nCURRENT ENTRY JSON: ${JSON.stringify(currentRecord).slice(0, 5000)}` }] }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: mode === 'contexts' ? 'context_examples' : mode === 'spanish' ? 'spanish_explanation' : mode === 'compare' ? 'comparison' : mode === 'sentence' ? 'sentence_feedback' : 'entry_improvements',
            strict: true,
            schema: mode === 'contexts' ? contextSchema : mode === 'spanish' ? spanishSchema : mode === 'compare' ? compareSchema : mode === 'sentence' ? sentenceSchema : improveSchema
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'OpenAI request failed.' });

    let output = data.output_text;
    if (!output && Array.isArray(data.output)) {
      for (const item of data.output) {
        for (const c of item?.content || []) {
          if (c?.type === 'output_text' && c.text) output = c.text;
        }
      }
    }
    if (!output) return res.status(502).json({ error: 'The AI returned no usable content.' });
    return res.status(200).json(JSON.parse(output));
  } catch (err) {
    console.error('word-help exception', err);
    return res.status(500).json({ error: err?.message || 'Could not generate help.' });
  }
};
