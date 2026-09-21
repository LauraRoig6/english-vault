import React, { useState, useEffect } from 'react';
import { X, Sparkles, Volume2 } from 'lucide-react';
import { exactDuplicate, findSimilarEntries } from '../lib/vaultUtils';


const typeOptions = ['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];

const emptyForm = {
  type: 'Vocabulary', word: '', meaning: '', spanish: '', example: '', my_example: '',
  register: '', level: '', variety: '', topic: '', tags: '', notes: '',
  synonyms: '', antonyms: '', related: '', pattern_structure: '', confused_with: '', usage_warning: '', pronunciation_easy: '', word_family: '', typical_collocations: '', best_for: '', avoid_overusing: '', mini_contrast: '', word_class: '', frequency: '', naturalness_score: '', naturalness_label: '', native_alternative: '', useful_for_exams: '', register_ladder: '', my_mistakes: '', personal_difficulty: '', confidence: '', why_useful: '', false_friend: '', separable: '', transitive: '', similar_expressions: '',
  how_common: '', offensive_warning: '', slang_tags: '',
  trick_category: '', rule: '', explanation: '', examples_list: '', exceptions: '', memory_trick: '', common_mistakes: '',
  is_favourite: false, is_difficult: false, is_known: false, needs_review: true,
};

function copyTemplate(word = '') {
  return `NEW DISCOVERY\n\nWORD / EXPRESSION: ${String(word || '').trim().toLowerCase()}\nTYPE:\nMEANING IN ENGLISH:\nSPANISH:\nEASY PRONUNCIATION:\nNATURAL EXAMPLE:\nMY EXAMPLE:\nREGISTER:\nLEVEL:\nVARIETY:\nTOPIC:\nTAGS:\nSYNONYMS:\nRELATED EXPRESSIONS:\nANTONYMS:\nWORD CLASS:\nWORD FAMILY:\nTYPICAL COLLOCATIONS:\nFREQUENCY:\nNATURALNESS SCORE:\nNATURALNESS LABEL:\nBEST FOR:\nUSEFUL FOR EXAMS:\nNATIVE ALTERNATIVE:\nREGISTER LADDER:\nWHY IS THIS USEFUL?:\nFALSE FRIEND:\nPERSONAL DIFFICULTY:\nCONFIDENCE:\nMY MISTAKES:\nPATTERN / STRUCTURE:\nCONFUSED WITH:\nMINI CONTRAST:\nAVOID OVERUSING:\nPHRASAL: SEPARABLE?:\nPHRASAL: TRANSITIVITY:\nRELATED PHRASAL VERBS:\nSLANG: HOW COMMON?:\nUSAGE WARNING:\nSLANG TAGS:\nTRICK CATEGORY:\nRULE:\nEXPLANATION:\nEXAMPLES:\nEXCEPTIONS:\nMEMORY TRICK:\nCOMMON MISTAKES:\nNOTES:`;
}

export default function EntryModal({ onClose, onSave, editingRecord, prefillRecord, existingRecords }) {
  const [form, setForm] = useState(emptyForm);
  const [duplicate, setDuplicate] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [quickText, setQuickText] = useState('');
  const [quickStatus, setQuickStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Live duplicate check. It ignores case, punctuation and extra spaces, so
  // “Be that as it may…” and “be that as it may” count as the same entry.
  useEffect(() => {
    setDuplicate(exactDuplicate(existingRecords, form.word, editingRecord?.__backendId));
  }, [form.word, existingRecords, editingRecord]);

  const similarEntries = findSimilarEntries(
    existingRecords,
    { word: form.word, synonyms: form.synonyms, related: form.related, confused_with: form.confused_with, topic: form.topic, tags: form.tags, type: form.type },
    editingRecord?.__backendId,
    4
  ).filter((r) => !duplicate || r.__backendId !== duplicate.__backendId);

  useEffect(() => {
    if (editingRecord) {
      const isTrick = editingRecord.type === 'Grammar / Trick';
      setForm({
        ...emptyForm,
        ...editingRecord,
        trick_category: isTrick ? (editingRecord.trick_category || editingRecord.separable || '') : '',
        rule: isTrick ? (editingRecord.rule || editingRecord.transitive || '') : '',
        explanation: isTrick ? (editingRecord.explanation || editingRecord.how_common || '') : '',
        examples_list: isTrick ? (editingRecord.examples_list || editingRecord.synonyms || '') : '',
        exceptions: isTrick ? (editingRecord.exceptions || editingRecord.offensive_warning || '') : '',
        memory_trick: isTrick ? (editingRecord.memory_trick || editingRecord.related || '') : '',
        common_mistakes: editingRecord.common_mistakes || (isTrick ? editingRecord.notes || '' : ''),
        usage_warning: editingRecord.usage_warning || (!isTrick ? editingRecord.offensive_warning || '' : ''),
        pattern_structure: editingRecord.pattern_structure || '',
        confused_with: editingRecord.confused_with || '',
        pronunciation_easy: editingRecord.pronunciation_easy || '',
        word_family: editingRecord.word_family || '',
        typical_collocations: editingRecord.typical_collocations || '',
        best_for: editingRecord.best_for || '',
        avoid_overusing: editingRecord.avoid_overusing || '',
        mini_contrast: editingRecord.mini_contrast || '',
        antonyms: editingRecord.antonyms || '', word_class: editingRecord.word_class || '', frequency: editingRecord.frequency || '', naturalness_score: editingRecord.naturalness_score || '', naturalness_label: editingRecord.naturalness_label || '', native_alternative: editingRecord.native_alternative || '', useful_for_exams: editingRecord.useful_for_exams || '', register_ladder: editingRecord.register_ladder || '', my_mistakes: editingRecord.my_mistakes || '', personal_difficulty: editingRecord.personal_difficulty || '', confidence: editingRecord.confidence || '', why_useful: editingRecord.why_useful || '', false_friend: editingRecord.false_friend || '',
      });
    } else if (prefillRecord) {
      const allowed = ['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'];
      const safe = Object.fromEntries(Object.keys(emptyForm).map((k) => [k, prefillRecord[k] ?? emptyForm[k]]));
      setForm({
        ...emptyForm,
        ...safe,
        type: allowed.includes(prefillRecord.type) ? prefillRecord.type : 'Vocabulary',
        word: String(prefillRecord.word || '').toLowerCase(),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingRecord, prefillRecord]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e, keepOpen = false) => {
    e.preventDefault();
    const editingId = editingRecord?.__backendId;
    // Only block a true duplicate. Variants such as “banana peeled” remain valid.
    if (!editingId) {
      const dup = exactDuplicate(existingRecords, form.word);
      if (dup) { setDuplicate(dup); return; }
    }
    const isTrick = form.type === 'Grammar / Trick';
    const record = {
      type: form.type, word: form.word.trim().toLowerCase(), meaning: form.meaning,
      spanish: form.spanish, example: form.example, my_example: form.my_example,
      register: form.register, level: form.level, variety: form.variety, topic: form.topic, tags: form.tags,
      pattern_structure: form.pattern_structure, confused_with: form.confused_with, usage_warning: form.usage_warning,
      pronunciation_easy: form.pronunciation_easy, word_family: form.word_family, typical_collocations: form.typical_collocations,
      best_for: form.best_for, avoid_overusing: form.avoid_overusing, mini_contrast: form.mini_contrast,
      antonyms: form.antonyms, word_class: form.word_class, frequency: form.frequency, naturalness_score: form.naturalness_score ? Number(form.naturalness_score) : 0, naturalness_label: form.naturalness_label, native_alternative: form.native_alternative, useful_for_exams: form.useful_for_exams, register_ladder: form.register_ladder, my_mistakes: form.my_mistakes, personal_difficulty: form.personal_difficulty, confidence: form.confidence, why_useful: form.why_useful, false_friend: form.false_friend,
      is_favourite: form.is_favourite, is_difficult: form.is_difficult, is_known: form.is_known, needs_review: form.needs_review,
      status: form.is_known ? 'Mastered' : (form.status || 'New'),
      separable: isTrick ? form.trick_category : form.separable,
      transitive: isTrick ? form.rule : form.transitive,
      synonyms: isTrick ? form.examples_list : form.synonyms,
      related: isTrick ? form.memory_trick : form.related,
      how_common: isTrick ? form.explanation : form.how_common,
      offensive_warning: isTrick ? form.exceptions : (form.type === 'Slang' ? (form.usage_warning || form.offensive_warning) : form.offensive_warning),
      notes: form.notes,
      common_mistakes: form.common_mistakes,
      trick_category: form.trick_category, rule: form.rule, explanation: form.explanation, examples_list: form.examples_list, exceptions: form.exceptions, memory_trick: form.memory_trick,
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
      'ANTONYMS': 'antonyms',
      'WORD CLASS': 'word_class',
      'EASY PRONUNCIATION': 'pronunciation_easy',
      'WORD FAMILY': 'word_family',
      'TYPICAL COLLOCATIONS': 'typical_collocations',
      'FREQUENCY': 'frequency',
      'NATURALNESS SCORE': 'naturalness_score',
      'NATURALNESS LABEL': 'naturalness_label',
      'NATIVE ALTERNATIVE': 'native_alternative',
      'USEFUL FOR EXAMS': 'useful_for_exams',
      'REGISTER LADDER': 'register_ladder',
      'MY MISTAKES': 'my_mistakes',
      'PERSONAL DIFFICULTY': 'personal_difficulty',
      'CONFIDENCE': 'confidence',
      'WHY IS THIS USEFUL?': 'why_useful',
      'FALSE FRIEND': 'false_friend',
      'PATTERN / STRUCTURE': 'pattern_structure',
      'MINI CONTRAST': 'mini_contrast',
      'BEST FOR': 'best_for',
      'AVOID OVERUSING': 'avoid_overusing',
      'CONFUSED WITH': 'confused_with',
      'PHRASAL: SEPARABLE?': 'separable',
      'PHRASAL: TRANSITIVITY': 'transitive',
      'RELATED PHRASAL VERBS': 'similar_expressions',
      'SLANG: HOW COMMON?': 'how_common',
      'USAGE WARNING': 'usage_warning',
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
      if (updates.word) updates.word = String(updates.word).toLowerCase();
      const newForm = { ...f, ...updates };
      console.log('New form state:', newForm);
      return newForm;
    });
    setQuickStatus('Form filled — review before saving ✨');
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(copyTemplate(form.word));
      setCopyStatus('Template copied! Paste it into ChatGPT ✨');
    } catch {
      setCopyStatus('Copy failed — select the text manually.');
    }
  };


  const speak = (lang) => {
    const text = form.word.trim();
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => (v.lang || '').toLowerCase() === lang.toLowerCase());
    const broad = voices.find((v) => (v.lang || '').toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (exact || broad) utter.voice = exact || broad;
    window.speechSynthesis.speak(utter);
  };

  const handleAiAutofill = async () => {
    const word = form.word.trim();
    if (!word) { setAiStatus('Write a word, expression or grammar point first.'); return; }
    setAiLoading(true);
    setAiStatus('Filling the entry…');
    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, type: form.type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Autofill failed.');
      const allowedKeys = Object.keys(emptyForm);
      const updates = {};
      allowedKeys.forEach((k) => {
        if (data[k] !== undefined && typeof data[k] !== 'boolean') updates[k] = data[k];
      });
      updates.word = String(data.word || word).toLowerCase();
      setForm((f) => ({ ...f, ...updates, my_example: f.my_example || '' }));
      setAiStatus('Done ✨ Review it before saving.');
    } catch (err) {
      setAiStatus(err?.message || 'Could not autofill this entry.');
    } finally {
      setAiLoading(false);
    }
  };

  const isPhrasal = form.type === 'Phrasal Verb';
  const isVerb = form.type === 'Verb';
  const isVocabulary = form.type === 'Vocabulary';
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
                onChange={(e) => set('word', e.target.value.toLowerCase())}
                style={{ borderColor: duplicate && !editingRecord ? '#d986a5' : undefined, background: duplicate && !editingRecord ? '#fff0f5' : undefined }} />
              {duplicate && !editingRecord && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '12px', background: '#fff0f5', border: '1px solid #eab7c8', color: '#9d4f6e', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>👋 Oye! Ya tienes <strong>“{duplicate.word}”</strong> en tu vault.</span>
                  <span style={{ color: '#a67b8b' }}>Si es una variante distinta, sigue escribiendo (ej. “banana peeled”) y podrás guardar.</span>
                </div>
              )}
              {!duplicate && form.word.trim() && similarEntries.length > 0 && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '12px', background: '#fffaf0', border: '1px solid #ead9a8', color: '#806a30', fontSize: '0.82rem' }}>
                  <strong>Related entries already in your Vault:</strong> {similarEntries.map((r) => r.word).join(', ')}. You can still save this one.
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <button className="soft-btn text-xs" type="button" onClick={() => speak('en-GB')} disabled={!form.word.trim()} title="British pronunciation"><Volume2 size={14} style={{ display: 'inline', marginRight: 4 }} />UK</button>
                <button className="soft-btn text-xs" type="button" onClick={() => speak('en-US')} disabled={!form.word.trim()} title="American pronunciation"><Volume2 size={14} style={{ display: 'inline', marginRight: 4 }} />US</button>
                <button className="primary-btn text-xs" type="button" onClick={handleAiAutofill} disabled={aiLoading || !form.word.trim()} style={{ padding: '8px 12px' }}><Sparkles size={14} style={{ display: 'inline', marginRight: 5 }} />{aiLoading ? 'Filling…' : 'Autofill with AI'}</button>
              </div>
              {aiStatus && <p className="mt-2 text-xs" style={{ color: aiStatus.startsWith('Done') ? '#4d7350' : '#9d4f6e' }}>{aiStatus}</p>}
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
            {!isTrick && <div className="field"><label>EASY PRONUNCIATION</label><input placeholder="e.g. /eskédiul/" value={form.pronunciation_easy} onChange={(e) => set('pronunciation_easy', e.target.value)} /></div>}
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
            {!isTrick && <div className="field"><label>ANTONYMS</label><input placeholder="e.g. accept, agree" value={form.antonyms} onChange={(e) => set('antonyms', e.target.value)} /></div>}
            {isVocabulary && <div className="field"><label>WORD CLASS</label>
              <select value={form.word_class} onChange={(e) => set('word_class', e.target.value)}>
                <option value="">Select</option><option>Noun</option><option>Adjective</option><option>Adverb</option><option>Other</option>
              </select>
            </div>}
            {isVerb && <div className="field"><label>VERB CATEGORY</label><input value="Lexical verb" disabled /></div>}
            {!isTrick && <div className="field"><label>WORD FAMILY</label><input placeholder="e.g. confuse, confusion, confused" value={form.word_family} onChange={(e) => set('word_family', e.target.value)} /></div>}
            {!isTrick && <div className="field"><label>TYPICAL COLLOCATIONS</label><input placeholder="e.g. deeply confused, cause confusion" value={form.typical_collocations} onChange={(e) => set('typical_collocations', e.target.value)} /></div>}
            {!isTrick && <div className="field"><label>FREQUENCY</label>
              <select value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
                <option value="">Select</option><option>Very common</option><option>Common</option><option>Less common</option><option>Rare</option>
              </select>
            </div>}
            {!isTrick && <div className="field"><label>NATURALNESS</label>
              <select value={String(form.naturalness_score || '')} onChange={(e) => set('naturalness_score', e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select</option><option value="5">5 · Very natural</option><option value="4">4 · Natural</option><option value="3">3 · Neutral</option><option value="2">2 · A bit forced</option><option value="1">1 · Unnatural / awkward</option>
              </select>
            </div>}
            {!isTrick && <div className="field"><label>NATURALNESS NOTE</label><input value={form.naturalness_label} onChange={(e) => set('naturalness_label', e.target.value)} placeholder="e.g. Natural in writing, less common in speech" /></div>}
            {!isTrick && <div className="field"><label>NATIVE ALTERNATIVE</label><input value={form.native_alternative} onChange={(e) => set('native_alternative', e.target.value)} placeholder="A more usual alternative, if useful" /></div>}
            {!isTrick && <div className="field"><label>USEFUL FOR EXAMS</label><input value={form.useful_for_exams} onChange={(e) => set('useful_for_exams', e.target.value)} placeholder="e.g. Essay, Speaking, CAE/C1" /></div>}
            {!isTrick && <div className="field"><label>REGISTER LADDER</label><input value={form.register_ladder} onChange={(e) => set('register_ladder', e.target.value)} placeholder="e.g. kids → children → youngsters" /></div>}
            {!isTrick && <div className="field md:col-span-2"><label>WHY IS THIS USEFUL?</label><input value={form.why_useful} onChange={(e) => set('why_useful', e.target.value)} /></div>}
            {!isTrick && <div className="field"><label>FALSE FRIEND</label><input value={form.false_friend} onChange={(e) => set('false_friend', e.target.value)} placeholder="Leave blank unless relevant" /></div>}
            {!isTrick && <div className="field"><label>PERSONAL DIFFICULTY</label>
              <select value={form.personal_difficulty} onChange={(e) => set('personal_difficulty', e.target.value)}><option value="">Not set</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            </div>}
            {!isTrick && <div className="field"><label>CONFIDENCE</label>
              <select value={form.confidence} onChange={(e) => set('confidence', e.target.value)}><option value="">Not set</option><option>1 · Barely know it</option><option>2</option><option>3</option><option>4</option><option>5 · I own this</option></select>
            </div>}
            {!isTrick && <div className="field md:col-span-2"><label>MY MISTAKES</label><textarea placeholder="Your own real mistakes with this item" value={form.my_mistakes} onChange={(e) => set('my_mistakes', e.target.value)} /></div>}
            <div className="field md:col-span-2"><label>PATTERN / STRUCTURE</label><input placeholder="e.g. prevent sb from doing sth" value={form.pattern_structure} onChange={(e) => set('pattern_structure', e.target.value)} /></div>
            <div className="field md:col-span-2"><label>CONFUSED WITH</label><input placeholder="Only genuinely confusable words/expressions" value={form.confused_with} onChange={(e) => set('confused_with', e.target.value)} /></div>
            {!isTrick && <div className="field md:col-span-2"><label>MINI CONTRAST</label><input placeholder="Brief difference from a genuinely similar item" value={form.mini_contrast} onChange={(e) => set('mini_contrast', e.target.value)} /></div>}
            {!isTrick && <div className="field"><label>BEST FOR</label><input placeholder="e.g. formal writing, conversation" value={form.best_for} onChange={(e) => set('best_for', e.target.value)} /></div>}
            {!isTrick && <div className="field"><label>AVOID OVERUSING</label><input placeholder="Short naturalness note, if useful" value={form.avoid_overusing} onChange={(e) => set('avoid_overusing', e.target.value)} /></div>}
            {!isTrick && <div className="field md:col-span-2"><label>USAGE WARNING</label><textarea value={form.usage_warning} onChange={(e) => set('usage_warning', e.target.value)} /></div>}

            {isPhrasal && <>
              <div className="field"><label>PHRASAL: SEPARABLE?</label><input value={form.separable} onChange={(e) => set('separable', e.target.value)} /></div>
              <div className="field"><label>PHRASAL: TRANSITIVITY</label><input value={form.transitive} onChange={(e) => set('transitive', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>RELATED PHRASAL VERBS</label><input value={form.similar_expressions} onChange={(e) => set('similar_expressions', e.target.value)} /></div>
            </>}
            {isSlang && <>
              <div className="field"><label>SLANG: HOW COMMON?</label><input value={form.how_common} onChange={(e) => set('how_common', e.target.value)} /></div>
              <div className="field"><label>SLANG TAGS</label><input value={form.slang_tags} onChange={(e) => set('slang_tags', e.target.value)} /></div>
            </>}
            {isTrick && <>
              <div className="field"><label>TRICK CATEGORY</label><input value={form.trick_category} onChange={(e) => set('trick_category', e.target.value)} /></div>
              <div className="field"><label>RULE</label><input value={form.rule} onChange={(e) => set('rule', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>EXPLANATION</label><textarea value={form.explanation} onChange={(e) => set('explanation', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>EXAMPLES</label><textarea value={form.examples_list} onChange={(e) => set('examples_list', e.target.value)} /></div>
              <div className="field"><label>EXCEPTIONS</label><textarea value={form.exceptions} onChange={(e) => set('exceptions', e.target.value)} /></div>
              <div className="field"><label>MEMORY TRICK</label><textarea value={form.memory_trick} onChange={(e) => set('memory_trick', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>COMMON MISTAKES</label><textarea value={form.common_mistakes} onChange={(e) => set('common_mistakes', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>NOTES</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            </>}
            {!isTrick && <>
              <div className="field md:col-span-2"><label>COMMON MISTAKES</label><textarea value={form.common_mistakes} onChange={(e) => set('common_mistakes', e.target.value)} /></div>
              <div className="field md:col-span-2"><label>NOTES</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            </>}
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
