import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Heart, Volume2, Share2, Sparkles, Languages, GraduationCap, AlertTriangle, ArrowUpRight, ChevronLeft, ChevronRight, Check, GitCompareArrows, WandSparkles, MessageSquareText, BookOpenCheck, School, Clock3 } from 'lucide-react';
import { splitList, normalizeEntryText } from '../lib/vaultUtils';

function speak(text, lang) {
  if (!text) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase())
      || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  } catch (e) { /* ignore */ }
}

function PronounceButtons({ text }) {
  return (
    <div style={{ display: 'inline-flex', gap: '6px', marginLeft: '12px', verticalAlign: 'middle' }}>
      <button type="button" onClick={() => speak(text, 'en-GB')} className="soft-btn" title="British pronunciation"
        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
        <Volume2 size={14} /> UK
      </button>
      <button type="button" onClick={() => speak(text, 'en-US')} className="soft-btn" title="American pronunciation"
        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
        <Volume2 size={14} /> US
      </button>
    </div>
  );
}

function Chip({ kind, children }) {
  const cls = { type: 'chip-type', level: 'chip-level', register: 'chip-register', variety: 'chip-variety', topic: 'chip-topic', status: 'chip-status' }[kind] || 'chip-tag';
  return <span className={`chip ${cls}`}>{children}</span>;
}

function RichText({ text }) {
  if (!text) return null;
  const renderInline = (line) => {
    const parts = String(line).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2,-2)}</strong> : part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1,-1)}</em> : <React.Fragment key={i}>{part}</React.Fragment>);
  };
  const lines = String(text).split(/\n+/).filter(Boolean);
  return <div className="rich-text">{lines.map((line,i)=>/^[-•]\s/.test(line) ? <div key={i} className="rich-bullet">• {renderInline(line.replace(/^[-•]\s*/,''))}</div> : <p key={i}>{renderInline(line)}</p>)}</div>;
}

function RelatedPills({ label, value, onRelatedClick, allRecords = [] }) {
  const items = splitList(value);
  if (!items.length) return null;
  const existing = new Set(allRecords.map((r) => normalizeEntryText(r.word)));
  return (
    <section className="rounded-2xl p-4" style={{ background: label === 'CONFUSED WITH' ? '#fff7e8' : label === 'SYNONYMS' ? '#f4efff' : '#fff7fa', border: '1px solid #eadde3' }}>
      <p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#9a7180' }}>{label}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((item) => {
          const inVault = existing.has(normalizeEntryText(item));
          return (
            <button key={item} type="button" className={`related-pill ${inVault ? 'in-vault' : 'not-in-vault'}`} onClick={() => onRelatedClick?.(item)} title={inVault ? 'Open saved entry' : 'Add this to your Vault'}>
              {inVault && <Check size={12} />} {item} <ArrowUpRight size={12} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LexicalCloud({ label, value, onClick, allRecords = [], tone = "pink" }) {
  const items = splitList(value);
  if (!items.length) return null;
  const existing = new Set(allRecords.map((r) => normalizeEntryText(r.word)));
  return (
    <section className={`lexical-cloud cloud-${tone}`}>
      <p className="text-xs font-bold tracking-widest m-0 detail-block-title">{label}</p>
      <div className="lexical-cloud-items">{items.map((item,i)=>{ const inVault = existing.has(normalizeEntryText(item)); return <button key={item} type="button" className={inVault ? 'in-vault' : 'not-in-vault'} onClick={()=>onClick?.(item)} style={{fontSize:`${.76 + Math.min(i,3)*.07}rem`}}>{item}</button>; })}</div>
    </section>
  );
}

function WordFamilyGraph({ value, current, onClick, allRecords = [] }) {
  const items = splitList(value);
  if (!items.length) return null;
  const existing = new Set(allRecords.map((r) => normalizeEntryText(r.word)));
  return <section className="word-family-graph"><p className="text-xs font-bold tracking-widest m-0 detail-block-title">WORD FAMILY</p><div className="word-family-map"><span className="family-center">{current}</span>{items.map((x,i)=>{ const inVault = existing.has(normalizeEntryText(x)); return <button key={x} type="button" className={`family-node n${i%5} ${inVault ? 'in-vault' : 'not-in-vault'}`} onClick={()=>onClick?.(x)}>{x}</button>; })}</div></section>;
}

export default function DetailModal({ record, onClose, onEdit, onDelete, onToggleFav, onTagClick, onRelatedClick, onQuiz, allRecords = [], onStatusChange, onUpdate }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [contextExamples, setContextExamples] = useState(null);
  const [contextTab, setContextTab] = useState(0);
  const [spanishHelp, setSpanishHelp] = useState(null);
  const [helpLoading, setHelpLoading] = useState('');
  const [helpError, setHelpError] = useState('');
  const [spanishSlide, setSpanishSlide] = useState(0);
  const [statusOpen, setStatusOpen] = useState(false);
  const [compareWord, setCompareWord] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [sentenceText, setSentenceText] = useState('');
  const [sentenceResult, setSentenceResult] = useState(null);
  const [improveResult, setImproveResult] = useState(null);
  const [compareWord2, setCompareWord2] = useState('');
  const [compare3Result, setCompare3Result] = useState(null);
  const [teacherResult, setTeacherResult] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);
  const [shareStyle, setShareStyle] = useState('lace');
  const [detailTab, setDetailTab] = useState('general');
  const shareRef = useRef(null);

  if (!record) return null;

  const meta = [
    ['type', record.type], ['level', record.level], ['register', record.register],
    ['variety', record.variety], ['topic', record.topic],
    ...String(record.tags || '').split(',').map((x) => ['tag', x.trim()]),
  ].filter(([, v]) => v);

  const isTrick = record.type === 'Grammar / Trick';
  const usageWarning = record.usage_warning || (!isTrick ? record.offensive_warning : '');

  const fields = isTrick ? [
    ['Trick category', record.trick_category || record.separable],
    ['Rule', record.rule || record.transitive],
    ['Explanation', record.explanation || record.how_common],
    ['Examples', record.examples_list || record.synonyms],
    ['Exceptions', record.exceptions || record.offensive_warning],
    ['Memory trick', record.memory_trick || record.related],
    ['Common mistakes', record.common_mistakes || record.notes],
  ] : [
    ['Word class', record.word_class], ['Frequency', record.frequency], ['Naturalness note', record.naturalness_label],
    ['Why this is useful', record.why_useful], ['Semantic field', record.semantic_field], ['Etymology / origin', record.etymology], ['Common collocation mistake', record.collocation_mistake], ['Native alternative', record.native_alternative], ['Useful for exams', record.useful_for_exams], ['Register ladder', record.register_ladder], ['False friend', record.false_friend],
    ['Personal difficulty', record.personal_difficulty], ['Confidence', record.confidence], ['My mistakes', record.my_mistakes],
    ['Pattern / structure', record.pattern_structure],
    ['Best for', record.best_for], ['Avoid overusing', record.avoid_overusing], ['Mini contrast', record.mini_contrast],
    ['Common mistakes', record.common_mistakes], ['Notes', record.notes],
    ['Separable', record.separable], ['Transitivity', record.transitive],
    ['How common', record.how_common], ['Slang tags', record.slang_tags],
  ];

  const askAiHelp = async (mode) => {
    setHelpLoading(mode); setHelpError('');
    try {
      const response = await fetch('/api/word-help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, word: record.word, meaning: record.meaning || record.explanation || '', type: record.type || '', compare_word: compareWord,
          compare_word2: compareWord2, sentence: sentenceText, record }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not generate this help.');
      if (mode === 'contexts') setContextExamples(data.examples || []);
      else if (mode === 'spanish') { setSpanishHelp(data); setSpanishSlide(0); }
      else if (mode === 'compare') setCompareResult(data);
      else if (mode === 'compare3') setCompare3Result(data);
      else if (mode === 'teacher') setTeacherResult(data);
      else if (mode === 'challenge') setChallengeResult(data);
      else if (mode === 'sentence') setSentenceResult(data);
      else if (mode === 'improve') setImproveResult(data);
    } catch (err) { setHelpError(err?.message || 'Could not generate this help.'); }
    finally { setHelpLoading(''); }
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${record.word.replace(/[^\w-]/g, '_')}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: record.word, text: `${record.word} — from English Vault` }); return;
        }
      } catch (err) { /* fall through */ }
      const a = document.createElement('a'); a.href = dataUrl; a.download = `${record.word.replace(/[^\w-]/g, '_')}-english-vault.png`; a.click();
    } catch (e) { console.error('share failed', e); }
  };

  return (
    <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <article className="modal-panel p-6 md:p-8">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="eyebrow">{record.type}</p>
            <h2 className="page-title" style={{ display: 'inline' }}>{record.word}</h2>
            <PronounceButtons text={record.word} />
            {record.pronunciation_easy && <p className="mt-2 mb-0 text-sm font-bold" style={{ color: '#8b6577' }}>🗣 {record.pronunciation_easy}</p>}
          </div>
          <div className="flex gap-2">
            <button className="soft-btn p-2" type="button" aria-label="Toggle favourite" onClick={() => onToggleFav(record)} style={{ color: record.is_favourite ? '#b54f75' : '#887583' }}><Heart size={18} fill={record.is_favourite ? 'currentColor' : 'none'} /></button>
            <button className="soft-btn p-2" type="button" onClick={handleShare} aria-label="Share as image" title="Share as image"><Share2 size={18} /></button>
            <button className="soft-btn p-2" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 items-center">
          {meta.map(([k, v], i) => {
            const clickable = onTagClick && ['tag', 'topic', 'level', 'register', 'variety', 'type'].includes(k);
            return <span key={i} onClick={clickable ? () => onTagClick(v, k) : undefined} style={clickable ? { cursor: 'pointer', display: 'inline-block' } : {}} title={clickable ? `Filter by ${v}` : undefined}><Chip kind={k}>{v}</Chip></span>;
          })}
          {!isTrick && <button type="button" className={`chip confuse-toggle ${record.i_confuse_this ? 'active' : ''}`} onClick={() => onUpdate?.(record)} title="You decide whether this belongs in Words I confuse">🧩 {record.i_confuse_this ? 'I confuse this ✓' : 'I confuse this'}</button>}
          <div className="status-picker">
            <button type="button" className="chip chip-status status-picker-button" onClick={() => setStatusOpen((v) => !v)} title="Change learning status">
              {record.status || 'New'} ▾
            </button>
            {statusOpen && (
              <div className="status-picker-menu">
                {['New', 'Learning', 'Almost learnt', 'Mastered'].map((status) => (
                  <button key={status} type="button" className={(record.status || 'New') === status ? 'active' : ''} onClick={() => { onStatusChange?.(record, status); setStatusOpen(false); }}>
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isTrick && (
          <div className="detail-tabs mt-5" role="tablist" aria-label="Entry sections">
            <button type="button" className={detailTab === 'general' ? 'active' : ''} onClick={() => setDetailTab('general')}>General</button>
            <button type="button" className={detailTab === 'ai' ? 'active' : ''} onClick={() => setDetailTab('ai')}>AI Study Help</button>
          </div>
        )}

        {(isTrick || detailTab === 'general') && (
          <>
            {!isTrick && (record.meaning || record.spanish || record.example) && (
              <div className="grid md:grid-cols-3 gap-4 mt-5">
                {record.meaning && <section className="rounded-2xl p-4" style={{ background: '#fff0f6', border: '1px solid #f0cad9' }}><p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#a05c78' }}>💡 MEANING</p><p className="leading-relaxed mt-2 mb-0">{record.meaning}</p></section>}
                {record.spanish && <section className="rounded-2xl p-4" style={{ background: '#f2efff', border: '1px solid #dcd4f4' }}><p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#6d5d91' }}>🇪🇸 SPANISH</p><p className="leading-relaxed mt-2 mb-0">{record.spanish}</p></section>}
                {record.example && <section className="rounded-2xl p-4" style={{ background: '#fff8dd', border: '1px solid #ecdda7' }}><p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#8a7027' }}>✨ NATURAL EXAMPLE</p><p className="leading-relaxed mt-2 mb-0" style={{ fontStyle: 'italic' }}>{record.example}</p></section>}
              </div>
            )}

            {record.my_example && !isTrick && (
              <section className="mt-5 rounded-2xl p-4" style={{ background: '#eeeafb', border: '1px solid #d9d0ef' }}>
                <p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#665784' }}>MY EXAMPLE ✦</p>
                <p className="leading-relaxed mt-2 mb-0" style={{ fontWeight: 600 }}>{record.my_example}</p>
              </section>
            )}

            {!isTrick && (record.personal_note || record.variety_usage || record.sounds_better_as) && (
              <div className="learning-visual-grid mt-5">
                {record.variety_usage && <section className="uk-us-card"><p className="text-xs font-bold tracking-widest m-0 detail-block-title">🇬🇧 UK ↔ US 🇺🇸</p><p>{record.variety_usage}</p></section>}
                {record.sounds_better_as && <section className="sounds-better-card"><p className="text-xs font-bold tracking-widest m-0 detail-block-title">✨ SOUNDS BETTER AS…</p><p>{record.sounds_better_as}</p></section>}
                {record.personal_note && <section className="detail-postit"><p className="text-xs font-bold tracking-widest m-0 detail-block-title">MY POST-IT</p><p>{record.personal_note}</p></section>}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5 mt-7">
              {fields.filter(([, v]) => v).map(([label, value], index) => {
                const tones = [
                  ['#fff7fa','#efd3df','#9a7180'], ['#f7f4ff','#ded6f1','#6e6288'],
                  ['#fffaf0','#eadcaf','#806a30'], ['#f2faf5','#d4e8da','#52705c'],
                ];
                const [bg,border,labelColor] = tones[index % tones.length];
                return <section key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}><p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: labelColor }}>{label.toUpperCase()}</p><p className="leading-relaxed mt-2 whitespace-pre-line m-0">{value}</p></section>;
              })}
            </div>

            {usageWarning && (
              <section className="mt-6 rounded-2xl p-4" style={{ background: '#fff7df', border: '1px solid #ead59a' }}>
                <p className="text-xs font-bold tracking-widest m-0 detail-block-title" style={{ color: '#846821' }}><AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />USAGE WARNING</p>
                <p className="leading-relaxed mt-2 mb-0">{usageWarning}</p>
              </section>
            )}

            {!isTrick && (
              <section className="lexical-relations mt-6">
                <div className="lexical-relations-heading"><span>Lexical connections</span><small>Blue = already in your Vault</small></div>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <RelatedPills label="SYNONYMS" value={record.synonyms} onRelatedClick={onRelatedClick} allRecords={allRecords} />
                  <RelatedPills label="RELATED EXPRESSIONS" value={record.related} onRelatedClick={onRelatedClick} allRecords={allRecords} />
                  <RelatedPills label="ANTONYMS" value={record.antonyms} onRelatedClick={onRelatedClick} allRecords={allRecords} />
                  <RelatedPills label="CONFUSED WITH" value={record.confused_with} onRelatedClick={onRelatedClick} allRecords={allRecords} />
                  <RelatedPills label="RELATED PHRASAL VERBS" value={record.similar_expressions} onRelatedClick={onRelatedClick} allRecords={allRecords} />
                  <WordFamilyGraph value={record.word_family} current={record.word} onClick={onRelatedClick} allRecords={allRecords} />
                  <LexicalCloud label="COLLOCATION CLOUD" value={record.typical_collocations} onClick={onRelatedClick} allRecords={allRecords} tone="sage" />
                </div>
              </section>
            )}

            {!isTrick && record.naturalness_score && (
              <section className="naturalness-card mt-6">
                <div className="naturalness-head"><div><p className="eyebrow m-0 detail-block-title">Naturalness</p><strong>{record.naturalness_label || ({1:'Unnatural / awkward',2:'A bit forced',3:'Neutral',4:'Natural',5:'Very natural'})[record.naturalness_score]}</strong></div><span className="naturalness-score">{record.naturalness_score}/5</span></div>
                <div className="naturalness-thermometer" aria-label={`Naturalness ${record.naturalness_score} out of 5`}>
                  {[1,2,3,4,5].map((n) => <span key={n} className={`naturalness-step n${n} ${n <= Number(record.naturalness_score) ? 'filled' : ''}`} />)}
                  <span className="naturalness-marker" style={{ left: `calc(${((Number(record.naturalness_score)-1)/4)*100}% - 7px)` }} />
                </div>
                <div className="naturalness-labels"><span>awkward</span><span>very natural</span></div>
              </section>
            )}
          </>
        )}

        {!isTrick && detailTab === 'ai' && (
          <section className="mt-5 rounded-2xl p-4" style={{ background: '#fffafc', border: '1px solid #efd3df' }}>
            <p className="eyebrow" style={{ marginBottom: '8px' }}>AI study help</p>
            <div className="flex flex-wrap gap-2">
              <button className="soft-btn" type="button" onClick={() => askAiHelp('contexts')} disabled={!!helpLoading}><Sparkles size={15} style={{ display: 'inline', marginRight: 5 }} />{helpLoading === 'contexts' ? 'Generating…' : '3 context examples'}</button>
              <button className="soft-btn" type="button" onClick={() => askAiHelp('spanish')} disabled={!!helpLoading}><Languages size={15} style={{ display: 'inline', marginRight: 5 }} />{helpLoading === 'spanish' ? 'Explicando…' : 'Explícamelo en español'}</button>
              <button className="soft-btn" type="button" onClick={() => askAiHelp('improve')} disabled={!!helpLoading}><WandSparkles size={15} style={{ display: 'inline', marginRight: 5 }} />{helpLoading === 'improve' ? 'Checking…' : 'Improve this entry'}</button>
              <button className="primary-btn" type="button" onClick={() => onQuiz?.(record)}><GraduationCap size={15} style={{ display: 'inline', marginRight: 5 }} />Quiz me on this</button>
            </div>
            {helpError && <p className="text-sm mt-3" style={{ color: '#9d4f6e' }}>{helpError}</p>}
            {contextExamples && contextExamples.length > 0 && <div className="context-tabs mt-4"><div className="context-tab-buttons">{contextExamples.map((ex,i)=><button key={ex.context || i} className={i===contextTab?'active':''} type="button" onClick={()=>setContextTab(i)}>{ex.context}</button>)}</div>{contextExamples[contextTab] && <div className="context-tab-panel"><p className="context-example-sentence">{contextExamples[contextTab].sentence}</p><p className="text-sm m-0">{contextExamples[contextTab].why_it_fits}</p></div>}</div>}
            {spanishHelp && (() => {
              const slides = [
                spanishHelp.explanation && { title: 'Qué significa', icon: '💡', text: spanishHelp.explanation },
                spanishHelp.nuance && { title: 'El matiz', icon: '🎨', text: spanishHelp.nuance },
                spanishHelp.memory_tip && { title: 'Cómo recordarlo', icon: '🧠', text: spanishHelp.memory_tip },
              ].filter(Boolean);
              const slide = slides[Math.min(spanishSlide, Math.max(0, slides.length - 1))];
              if (!slide) return null;
              return (
                <div className="spanish-carousel mt-4">
                  <div className="spanish-carousel-top">
                    <span className="spanish-carousel-icon">{slide.icon}</span>
                    <div><p className="eyebrow m-0">Explícamelo en español</p><h3 className="spanish-carousel-title">{slide.title}</h3></div>
                  </div>
                  <div className="spanish-carousel-text"><RichText text={slide.text} /></div>
                  <div className="spanish-carousel-nav">
                    <button type="button" className="carousel-arrow" onClick={() => setSpanishSlide((i) => (i - 1 + slides.length) % slides.length)} aria-label="Anterior"><ChevronLeft size={18} /></button>
                    <div className="carousel-dots">{slides.map((_, i) => <button key={i} type="button" className={i === spanishSlide ? 'active' : ''} onClick={() => setSpanishSlide(i)} aria-label={`Diapositiva ${i + 1}`} />)}</div>
                    <button type="button" className="carousel-arrow" onClick={() => setSpanishSlide((i) => (i + 1) % slides.length)} aria-label="Siguiente"><ChevronRight size={18} /></button>
                  </div>
                </div>
              );
            })()}
            {improveResult?.suggestions?.length > 0 && <div className="ai-result-box mt-4"><strong>✨ Suggested improvements</strong><ul>{improveResult.suggestions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
            <div className="ai-tool-grid mt-4">
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">AI COMPARE</p>
                <select value={compareWord} onChange={(e)=>setCompareWord(e.target.value)}><option value="">Choose another Vault entry</option>{allRecords.filter(r=>r.__backendId!==record.__backendId).slice().sort((a,b)=>String(a.word).localeCompare(String(b.word))).map(r=><option key={r.__backendId} value={r.word}>{r.word}</option>)}</select>
                <button className="soft-btn mt-2" type="button" disabled={!compareWord || !!helpLoading} onClick={()=>askAiHelp('compare')}><GitCompareArrows size={14} style={{display:'inline',marginRight:5}}/>Compare</button>
                {compareResult && <div className="ai-result-box mt-3"><strong>{compareResult.headline}</strong><p>{compareResult.difference}</p><p className="text-sm"><b>Use {record.word} when:</b> {compareResult.use_first}</p><p className="text-sm"><b>Use {compareWord} when:</b> {compareResult.use_second}</p></div>}
              </div>
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">CHECK MY SENTENCE</p>
                <textarea placeholder={`Write your own sentence with “${record.word}”…`} value={sentenceText} onChange={(e)=>setSentenceText(e.target.value)} />
                <button className="soft-btn mt-2" type="button" disabled={!sentenceText.trim() || !!helpLoading} onClick={()=>askAiHelp('sentence')}><MessageSquareText size={14} style={{display:'inline',marginRight:5}}/>Check naturalness</button>
                {sentenceResult && <div className="ai-result-box mt-3"><strong>{sentenceResult.verdict}</strong><p>{sentenceResult.feedback}</p>{sentenceResult.improved_sentence && <p className="text-sm"><b>More natural:</b> {sentenceResult.improved_sentence}</p>}</div>}
              </div>
            </div>
            <div className="ai-tool-grid mt-4">
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">COMPARE 3 WORDS</p>
                <select value={compareWord2} onChange={(e)=>setCompareWord2(e.target.value)}><option value="">Choose a third Vault entry</option>{allRecords.filter(r=>r.__backendId!==record.__backendId && r.word!==compareWord).slice().sort((a,b)=>String(a.word).localeCompare(String(b.word))).map(r=><option key={r.__backendId} value={r.word}>{r.word}</option>)}</select>
                <button className="soft-btn mt-2" type="button" disabled={!compareWord || !compareWord2 || !!helpLoading} onClick={()=>askAiHelp('compare3')}><GitCompareArrows size={14} style={{display:'inline',marginRight:5}}/>Compare three</button>
                {compare3Result && <div className="ai-result-box mt-3"><strong>{compare3Result.headline}</strong>{compare3Result.items?.map((x,i)=><p key={i}><b>{x.word}:</b> {x.best_when} · {x.contrast}</p>)}<p><b>Bottom line:</b> {compare3Result.bottom_line}</p></div>}
              </div>
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">USE IT IN CONTEXT</p>
                <button className="soft-btn mt-2" type="button" disabled={!!helpLoading} onClick={()=>askAiHelp('challenge')}><BookOpenCheck size={14} style={{display:'inline',marginRight:5}}/>Give me a challenge</button>
                {challengeResult && <div className="ai-result-box mt-3"><strong>{challengeResult.situation}</strong><p>{challengeResult.task}</p><details><summary>Model answer</summary><p>{challengeResult.model_answer}</p></details></div>}
              </div>
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">TEACHER MODE</p>
                <button className="soft-btn mt-2" type="button" disabled={!!helpLoading} onClick={()=>askAiHelp('teacher')}><School size={14} style={{display:'inline',marginRight:5}}/>Generate classroom set</button>
                {teacherResult && <div className="ai-result-box mt-3"><p><b>B1:</b> {teacherResult.b1}</p><p><b>B2:</b> {teacherResult.b2}</p><p><b>C1:</b> {teacherResult.c1}</p><p><b>Gap-fill:</b> {teacherResult.gap_fill}</p><p><b>Question:</b> {teacherResult.question}</p></div>}
              </div>
              <div className="ai-mini-tool">
                <p className="text-xs font-bold tracking-widest m-0">ENTRY HISTORY</p>
                <div className="history-lines"><p><Clock3 size={13}/> Added: {record.created_at ? new Date(record.created_at).toLocaleDateString() : '—'}</p><p>Last reviewed: {record.last_reviewed_at ? new Date(record.last_reviewed_at).toLocaleDateString() : 'Never'}</p><p>Reviews: {record.review_count || 0} · Score: {record.review_score || 0}</p></div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-7 pt-5 border-t flex flex-wrap justify-between gap-3" style={{ borderColor: '#e8d8df' }}>
          <button className="text-sm font-bold px-2 bg-transparent border-0" style={{ color: '#b44c70', cursor: 'pointer' }} type="button" onClick={() => { if (confirmDelete) onDelete(record); else setConfirmDelete(true); }}>{confirmDelete ? 'Confirm delete' : 'Delete entry'}</button>
          <div className="flex gap-2"><button className="soft-btn" type="button" onClick={() => onEdit(record)}>Edit</button><button className="soft-btn" type="button" onClick={onClose}>Close</button></div>
        </div>

        <div className="share-style-picker mt-5"><span>Share card style:</span>{['lace','minimal','notebook'].map(x=><button key={x} type="button" className={shareStyle===x?'active':''} onClick={()=>setShareStyle(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>

        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <div ref={shareRef} className={`share-card share-${shareStyle}`} style={{ width: '540px', padding: '48px', fontFamily: "'DM Sans', sans-serif", color: '#3d3540' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a46880', margin: 0 }}>English Vault ✦</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '3.4rem', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.03em', margin: '10px 0 6px', color: '#3d3540' }}>{record.word}</h1>
            <p style={{ fontSize: '0.85rem', color: '#a46880', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 20px' }}>{record.type}{record.level ? ` · ${record.level}` : ''}</p>
            {record.meaning && <div style={{ background: 'rgba(255,255,255,0.68)', borderRadius: '18px', padding: '18px', marginTop: '10px' }}><p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#9a7180', margin: 0 }}>MEANING</p><p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{record.meaning}</p></div>}
            {record.spanish && <div style={{ background: 'rgba(233,227,250,0.7)', borderRadius: '18px', padding: '18px', marginTop: '12px' }}><p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#655782', margin: 0 }}>ESPAÑOL</p><p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{record.spanish}</p></div>}
            {record.example && <div style={{ background: 'rgba(255,243,201,0.75)', borderRadius: '18px', padding: '18px', marginTop: '12px' }}><p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#85671f', margin: 0 }}>EXAMPLE</p><p style={{ margin: '6px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{record.example}&rdquo;</p></div>}
            <p style={{ marginTop: '28px', fontSize: '0.75rem', color: '#a46880', fontWeight: 700, letterSpacing: '0.1em' }}>SAVED IN MY ENGLISH VAULT</p>
          </div>
        </div>
      </article>
    </div>
  );
}
