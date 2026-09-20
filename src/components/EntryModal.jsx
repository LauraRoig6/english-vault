import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';


const typeOptions = ['Vocabulary', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];

const emptyForm = {
  type: 'Vocabulary', word: '', meaning: '', spanish: '', example: '', my_example: '',
  register: '', level: '', variety: '', topic: '', tags: '', notes: '',
  synonyms: '', related: '', separable: '', transitive: '', similar_expressions: '',
  how_common: '', offensive_warning: '', slang_tags: '',
  trick_category: '', rule: '', explanation: '', examples_list: '', exceptions: '', memory_trick: '', common_mistakes: '',
  is_favourite: false, is_difficult: false, is_known: false, needs_review: true,
};

function copyTemplate() {
  return `NEW DISCOVERY\n\nWORD / EXPRESSION:\nTYPE:\nMEANING IN ENGLISH:\nSPANISH:\nNATURAL EXAMPLE:\nMY EXAMPLE:\nREGISTER:\nLEVEL:\nVARIETY:\nTOPIC:\nTAGS:\nSYNONYMS:\nRELATED EXPRESSIONS:\nPHRASAL: SEPARABLE?:\nPHRASAL: TRANSITIVITY:\nRELATED PHRASAL VERBS:\nSLANG: HOW COMMON?:\nUSAGE WARNING:\nSLANG TAGS:\nTRICK CATEGORY:\nRULE:\nEXPLANATION:\nEXAMPLES:\nEXCEPTIONS:\nMEMORY TRICK:\nCOMMON MISTAKES:\nNOTES:`;
}

export default function EntryModal({ onClose, onSave, editingRecord, prefillRecord, existingRecords }) {
  const [form, setForm] = useState(emptyForm);
  const [duplicate, setDuplicate] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [quickText, setQuickText] = useState('');
  const [quickStatus, setQuickStatus] = useState('');

  // Live duplicate check as user types the word
  useEffect(() => {
    const w = form.word.trim().toLowerCase();
    if (!w) { setDuplicate(null); return; }
    const editingId = editingRecord?.__backendId;
    const dup = existingRecords.find((r) => r.__backendId !== editingId && (r.word || '').trim().toLowerCase() === w);
    setDuplicate(dup || null);
  }, [form.word, existingRecords, editingRecord]);

  useEffect(() => {
    if (editingRecord) {
      const isTrick = editingRecord.type === 'Grammar / Trick';
      setForm({
        ...emptyForm,
        ...editingRecord,
        trick_category: isTrick ? editingRecord.separable || '' : '',
        rule: isTrick ? editingRecord.transitive || '' : '',
        explanation: isTrick ? editingRecord.how_common || '' : '',
        examples_list: isTrick ? editingRecord.synonyms || '' : '',
        exceptions: isTrick ? editingRecord.offensive_warning || '' : '',
        memory_trick: isTrick ? editingRecord.related || '' : '',
        common_mistakes: isTrick ? editingRecord.notes || '' : '',
      });
    } else if (prefillRecord) {
      const allowed = ['Vocabulary', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];
      setForm({
        ...emptyForm,
        type: allowed.includes(prefillRecord.type) ? prefillRecord.type : 'Vocabulary',
        word: prefillRecord.word || '',
        meaning: prefillRecord.meaning || '',
        spanish: prefillRecord.spanish || '',
        example: prefillRecord.example || '',
        register: prefillRecord.register || '',
        level: prefillRecord.level || '',
        variety: prefillRecord.variety || '',
        topic: prefillRecord.topic || '',
        tags: prefillRecord.tags || '',
        synonyms: prefillRecord.synonyms || '',
        related: prefillRecord.related || '',
        notes: prefillRecord.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingRecord, prefillRecord]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e, keepOpen = false) => {
    e.preventDefault();
    const editingId = editingRecord?.__backendId;
    const normWord = form.word.trim().toLowerCase();
    // Only block save if exact duplicate exists AND it's a new entry
    if (!editingId && normWord) {
      const dup = existingRecords.find((r) => (r.word || '').trim().toLowerCase() === normWord);
      if (dup) { setDuplicate(dup); return; }
    }
    const isTrick = form.type === 'Grammar / Trick';
    const record = {
      type: form.type, word: form.word.trim(), meaning: form.meaning,
      spanish: form.spanish, example: form.example, my_example: form.my_example,
      register: form.register, level: form.level, variety: form.variety, topic: form.topic, tags: form.tags,
      is_favourite: form.is_favourite, is_difficult: form.is_difficult, is_known: form.is_known, needs_review: form.needs_review,
      status: form.is_known ? 'Mastered' : (form.status || 'New'),
      separable: isTrick ? form.trick_category : form.separable,
      transitive: isTrick ? form.rule : form.transitive,
      synonyms: isTrick ? form.examples_list : form.synonyms,
      related: isTrick ? form.memory_trick : form.related,
      how_common: isTrick ? form.explanation : form.how_common,
      offensive_warning: isTrick ? form.exceptions : form.offensive_warning,
      notes: isTrick ? form.common_mistakes : form.notes,
      similar_expressions: form.similar_expressions,
      slang_tags: form.slang_tags,
      review_count: form.review_count || 0,
      review_score: form.review_score || 0,
    };
    onSave(record);
    if (keepOpen) {
      setForm(emptyForm);
      setDuplicate(null);
    } else {
      onClose();
    }
  };

  const handleQuickFill = () => {
    console.log('=== handleQuickFill called ===');
    console.log('quickText length:', quickText.length);
    console.log('quickText:', quickText);
    
    const fieldMap = {
      'TYPE': 'type',
      'WORD / EXPRESSION': 'word',
      'MEANING IN ENGLISH': 'meaning',
      'SPANISH': 'spanish',
      'NATURAL EXAMPLE': 'example',
      'MY EXAMPLE': 'my_example',
      'REGISTER': 'register',
      'LEVEL': 'level',
      'VARIETY': 'variety',
      'TOPIC': 'topic',
      'TAGS': 'tags',
      'SYNONYMS': 'synonyms',
      'RELATED EXPRESSIONS': 'related',
      'PHRASAL: SEPARABLE?': 'separable',
      'PHRASAL: TRANSITIVITY': 'transitive',
      'RELATED PHRASAL VERBS': 'similar_expressions',
      'SLANG: HOW COMMON?': 'how_common',
      'USAGE WARNING': 'offensive_warning',
      'SLANG TAGS': 'slang_tags',
      'TRICK CATEGORY': 'trick_category',
      'RULE': 'rule',
      'EXPLANATION': 'explanation',
      'EXAMPLES': 'examples_list',
      'EXCEPTIONS': 'exceptions',
      'MEMORY TRICK': 'memory_trick',
      'COMMON MISTAKES': 'common_mistakes',
      'NOTES': 'notes',
    };
    const sortedKeys = Object.keys(fieldMap).sort((a, b) => b.length - a.length);
    console.log('sortedKeys:', sortedKeys);
    
    const updates = {};
    const lines = quickText.split(/\r?\n/);
    console.log('Total lines:', lines.length);
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const upper = trimmedLine.toUpperCase();
      const key = sortedKeys.find((k) => upper.startsWith(k + ':'));
      if (key) {
        const v = trimmedLine.slice(key.length + 1).trim();
        updates[fieldMap[key]] = v === '—' ? '' : v;
        console.log(`Line ${index}: Matched key "${key}" -> field "${fieldMap[key]}" = "${v}"`);
      }
    });
    
    console.log('Final updates object:', updates);
    console.log('Number of fields to update:', Object.keys(updates).length);
    
    setForm((f) => {
      console.log('Previous form state:', f);
      const newForm = { ...f, ...updates };
      console.log('New form state:', newForm);
      return newForm;
    });
    setQuickStatus('Form filled — review before saving ✨');
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(copyTemplate());
      setCopyStatus('Template copied! Paste it into ChatGPT ✨');
    } catch {
      setCopyStatus('Copy failed — select the text manually.');
    }
  };

  const isPhrasal = form.type === 'Phrasal Verb';
  const isSlang = form.type === 'Slang';
  const isTrick = form.type === 'Grammar / Trick';

  return (
    <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="eyebrow">{editingRecord ? 'Update discovery' : 'New discovery'}</p>
            <h2 className="section-heading">{editingRecord ? 'Edit entry' : 'Add a new entry'}</h2>
          </div>
          <button className="soft-btn p-2" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <details className="rounded-2xl border p-4" style={{ borderColor: '#efd3df', background: '#fff7fa' }}>
            <summary className="cursor-pointer text-sm font-bold" style={{ color: '#9d4f6e' }}>Quick fill</summary>
            <div className="mt-3">
              <textarea className="w-full rounded-xl border p-3" style={{ borderColor: '#e8d8df', minHeight: '160px', font: 'inherit' }} placeholder="Paste a completed ChatGPT template here…" value={quickText} onChange={(e) => setQuickText(e.target.value)} />
              <button className="soft-btn mt-3" type="button" onClick={handleQuickFill}>Fill form</button>
              {quickStatus && <p className="mt-2 text-xs" style={{ color: '#9d4f6e' }}>{quickStatus}</p>}
            </div>
          </details>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="field"><label>TYPE</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {typeOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>WORD / EXPRESSION</label>
              <input required value={form.word}
                onChange={(e) => set('word', e.target.value)}
                style={{ borderColor: duplicate && !editingRecord ? '#d986a5' : undefined, background: duplicate && !editingRecord ? '#fff0f5' : undefined }} />
              {duplicate && !editingRecord && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '12px', background: '#fff0f5', border: '1px solid #eab7c8', color: '#9d4f6e', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>👋 Oye! Ya tienes <strong>“{duplicate.word}”</strong> en tu vault.</span>
                  <span style={{ color: '#a67b8b' }}>Si es una variante distinta, sigue escribiendo (ej. “banana peeled”) y podrás guardar.</span>
                </div>
              )}
            </div>
          </div>

          <details className="mt-4 rounded-2xl border p-4" style={{ borderColor: '#efd3df', background: '#fff7fa' }}>
            <summary className="cursor-pointer text-sm font-bold" style={{ color: '#9d4f6e' }}>Need help filling this in?</summary>
            <div className="mt-3">
              <button className="soft-btn w-full text-sm" type="button" onClick={handleCopyTemplate}>Copy template for ChatGPT</button>
              {copyStatus && <p className="mt-2 text-xs" style={{ color: '#9d4f6e' }}>{copyStatus}</p>}
            </div>
          </details>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="field md:col-span-2"><label>MEANING IN ENGLISH</label><textarea required={!isTrick} value={form.meaning} onChange={(e) => set('meaning', e.target.value)} /></div>
            <div className="field"><label>SPANISH</label><input value={form.spanish} onChange={(e) => set('spanish', e.target.value)} /></div>
            <div className="field"><label>NATURAL EXAMPLE</label><input value={form.example} onChange={(e) => set('example', e.target.value)} /></div>
            <div className="field"><label>MY EXAMPLE</label><textarea style={{ minHeight: '52px' }} value={form.my_example} onChange={(e) => set('my_example', e.target.value)} /></div>
            <div className="field"><label>REGISTER</label>
              <select value={form.register} onChange={(e) => set('register', e.target.value)}>
                <option value="">Select</option>
                {['Formal', 'Neutral', 'Informal', 'Slang'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="field"><label>LEVEL</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)}>
                <option value="">Select</option>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="field"><label>VARIETY</label>
              <select value={form.variety} onChange={(e) => set('variety', e.target.value)}>
                <option value="">Select</option>
                {['British English', 'American English', 'Both'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="field"><label>TOPIC</label><input value={form.topic} onChange={(e) => set('topic', e.target.value)} /></div>
            <div className="field md:col-span-2"><label>TAGS</label><input placeholder="Separate tags with commas" value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
            <div className="field"><label>SYNONYMS</label><input value={form.synonyms} onChange={(e) => set('synonyms', e.target.value)} /></div>
            <div className="field"><label>RELATED EXPRESSIONS</label><input value={form.related} onChange={(e) => set('related', e.target.value)} /></div>

            {isPhrasal && <>
              <div className="field"><label>PHRASAL: SEPARABLE?</label><input value={form.separable} onChange={(e) => set('separable', e.target.value)} /></div>
              <div className="field"><label>PHRASAL: TRANSITIVITY</label><input value={form.transitive} onChange={(e) => set('transitive', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>RELATED PHRASAL VERBS</label><input value={form.similar_expressions} onChange={(e) => set('similar_expressions', e.target.value)} /></div>
            </>}
            {isSlang && <>
              <div className="field"><label>SLANG: HOW COMMON?</label><input value={form.how_common} onChange={(e) => set('how_common', e.target.value)} /></div>
              <div className="field"><label>USAGE WARNING</label><input value={form.offensive_warning} onChange={(e) => set('offensive_warning', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>SLANG TAGS</label><input value={form.slang_tags} onChange={(e) => set('slang_tags', e.target.value)} /></div>
            </>}
            {isTrick && <>
              <div className="field"><label>TRICK CATEGORY</label><input value={form.trick_category} onChange={(e) => set('trick_category', e.target.value)} /></div>
              <div className="field"><label>RULE</label><input value={form.rule} onChange={(e) => set('rule', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>EXPLANATION</label><textarea value={form.explanation} onChange={(e) => set('explanation', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>EXAMPLES</label><textarea value={form.examples_list} onChange={(e) => set('examples_list', e.target.value)} /></div>
              <div className="field"><label>EXCEPTIONS</label><textarea value={form.exceptions} onChange={(e) => set('exceptions', e.target.value)} /></div>
              <div className="field"><label>MEMORY TRICK</label><textarea value={form.memory_trick} onChange={(e) => set('memory_trick', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>COMMON MISTAKES</label><textarea value={form.common_mistakes} onChange={(e) => set('common_mistakes', e.target.value)} /></div>
            </>}
            {!isTrick && <div className="field md:col-span-2"><label>NOTES</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-6">
            {[['is_favourite', 'Favourite'], ['is_difficult', 'Difficult'], ['is_known', 'I know it'], ['needs_review', 'Need to review']].map(([k, label]) => (
              <label key={k} className="flex gap-2 items-center p-3 rounded-xl" style={{ background: '#fff7fa' }}>
                <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-7">
            {!editingRecord && <button className="soft-btn" type="button" onClick={(e) => handleSubmit(e, true)}>Save & add another</button>}
            <button className="primary-btn" type="submit">{editingRecord ? 'Save changes' : 'Save entry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
