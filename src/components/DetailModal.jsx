import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Heart, Volume2, Share2, Sparkles, Languages, GraduationCap, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { splitList } from '../lib/vaultUtils';

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

function RelatedPills({ label, value, onRelatedClick }) {
  const items = splitList(value);
  if (!items.length) return null;
  return (
    <section className="rounded-2xl p-4" style={{ background: '#fff7fa' }}>
      <p className="text-xs font-bold tracking-widest m-0" style={{ color: '#9a7180' }}>{label}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((item) => (
          <button key={item} type="button" className="soft-btn text-xs" style={{ padding: '7px 10px' }} onClick={() => onRelatedClick?.(item)}>
            {item} <ArrowUpRight size={12} style={{ display: 'inline', marginLeft: 3 }} />
          </button>
        ))}
      </div>
    </section>
  );
}

export default function DetailModal({ record, onClose, onEdit, onDelete, onToggleFav, onTagClick, onRelatedClick, onQuiz }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [contextExamples, setContextExamples] = useState(null);
  const [spanishHelp, setSpanishHelp] = useState(null);
  const [helpLoading, setHelpLoading] = useState('');
  const [helpError, setHelpError] = useState('');
  const shareRef = useRef(null);

  if (!record) return null;

  const meta = [
    ['type', record.type], ['status', record.status || 'New'], ['level', record.level], ['register', record.register],
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
    ['Meaning', record.meaning], ['Spanish', record.spanish], ['Natural example', record.example],
    ['Pattern / structure', record.pattern_structure], ['Common mistakes', record.common_mistakes], ['Notes', record.notes],
    ['Separable', record.separable], ['Transitivity', record.transitive],
    ['How common', record.how_common], ['Slang tags', record.slang_tags],
  ];

  const askAiHelp = async (mode) => {
    setHelpLoading(mode); setHelpError('');
    try {
      const response = await fetch('/api/word-help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, word: record.word, meaning: record.meaning || record.explanation || '', type: record.type || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not generate this help.');
      if (mode === 'contexts') setContextExamples(data.examples || []); else setSpanishHelp(data);
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
          </div>
          <div className="flex gap-2">
            <button className="soft-btn p-2" type="button" aria-label="Toggle favourite" onClick={() => onToggleFav(record)} style={{ color: record.is_favourite ? '#b54f75' : '#887583' }}><Heart size={18} fill={record.is_favourite ? 'currentColor' : 'none'} /></button>
            <button className="soft-btn p-2" type="button" onClick={handleShare} aria-label="Share as image" title="Share as image"><Share2 size={18} /></button>
            <button className="soft-btn p-2" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {meta.map(([k, v], i) => {
            const clickable = onTagClick && ['tag', 'topic', 'level', 'register', 'variety', 'status', 'type'].includes(k);
            return <span key={i} onClick={clickable ? () => onTagClick(v, k) : undefined} style={clickable ? { cursor: 'pointer', display: 'inline-block' } : {}} title={clickable ? `Filter by ${v}` : undefined}><Chip kind={k}>{v}</Chip></span>;
          })}
        </div>

        {usageWarning && (
          <section className="mt-5 rounded-2xl p-4" style={{ background: '#fff7df', border: '1px solid #ead59a' }}>
            <p className="text-xs font-bold tracking-widest m-0" style={{ color: '#846821' }}><AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />USAGE WARNING</p>
            <p className="leading-relaxed mt-2 mb-0">{usageWarning}</p>
          </section>
        )}

        {!isTrick && (
          <section className="mt-5 rounded-2xl p-4" style={{ background: '#fffafc', border: '1px solid #efd3df' }}>
            <p className="eyebrow" style={{ marginBottom: '8px' }}>AI study help</p>
            <div className="flex flex-wrap gap-2">
              <button className="soft-btn" type="button" onClick={() => askAiHelp('contexts')} disabled={!!helpLoading}><Sparkles size={15} style={{ display: 'inline', marginRight: 5 }} />{helpLoading === 'contexts' ? 'Generating…' : '3 context examples'}</button>
              <button className="soft-btn" type="button" onClick={() => askAiHelp('spanish')} disabled={!!helpLoading}><Languages size={15} style={{ display: 'inline', marginRight: 5 }} />{helpLoading === 'spanish' ? 'Explicando…' : 'Explícamelo en español'}</button>
              <button className="primary-btn" type="button" onClick={() => onQuiz?.(record)}><GraduationCap size={15} style={{ display: 'inline', marginRight: 5 }} />Quiz me on this</button>
            </div>
            {helpError && <p className="text-sm mt-3" style={{ color: '#9d4f6e' }}>{helpError}</p>}
            {contextExamples && contextExamples.length > 0 && <div className="grid md:grid-cols-3 gap-3 mt-4">{contextExamples.map((ex, i) => <div key={i} className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #eadde3' }}><p className="text-xs font-bold tracking-widest m-0" style={{ color: '#9a7180' }}>{ex.context}</p><p className="mt-2 mb-1" style={{ lineHeight: 1.5 }}>{ex.sentence}</p><p className="text-xs m-0" style={{ color: '#7b6d75', lineHeight: 1.45 }}>{ex.why_it_fits}</p></div>)}</div>}
            {spanishHelp && <div className="mt-4 rounded-xl p-4" style={{ background: '#fff', border: '1px solid #eadde3' }}><p className="m-0" style={{ lineHeight: 1.6 }}>{spanishHelp.explanation}</p>{spanishHelp.nuance && <p className="mt-3 mb-0 text-sm"><strong>Matiz:</strong> {spanishHelp.nuance}</p>}{spanishHelp.memory_tip && <p className="mt-2 mb-0 text-sm"><strong>Truco:</strong> {spanishHelp.memory_tip}</p>}</div>}
          </section>
        )}

        {record.my_example && !isTrick && (
          <section className="mt-5 rounded-2xl p-4" style={{ background: '#eeeafb', border: '1px solid #d9d0ef' }}>
            <p className="text-xs font-bold tracking-widest m-0" style={{ color: '#665784' }}>MY EXAMPLE ✦</p>
            <p className="leading-relaxed mt-2 mb-0" style={{ fontWeight: 600 }}>{record.my_example}</p>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-5 mt-7">
          {fields.filter(([, v]) => v).map(([label, value]) => <section key={label} className="rounded-2xl p-4" style={{ background: '#fff7fa' }}><p className="text-xs font-bold tracking-widest m-0" style={{ color: '#9a7180' }}>{label}</p><p className="leading-relaxed mt-2 whitespace-pre-line m-0">{value}</p></section>)}
          {!isTrick && <RelatedPills label="SYNONYMS" value={record.synonyms} onRelatedClick={onRelatedClick} />}
          {!isTrick && <RelatedPills label="RELATED EXPRESSIONS" value={record.related} onRelatedClick={onRelatedClick} />}
          {!isTrick && <RelatedPills label="CONFUSED WITH" value={record.confused_with} onRelatedClick={onRelatedClick} />}
          {!isTrick && <RelatedPills label="RELATED PHRASAL VERBS" value={record.similar_expressions} onRelatedClick={onRelatedClick} />}
        </div>

        <div className="mt-7 pt-5 border-t flex flex-wrap justify-between gap-3" style={{ borderColor: '#e8d8df' }}>
          <button className="text-sm font-bold px-2 bg-transparent border-0" style={{ color: '#b44c70', cursor: 'pointer' }} type="button" onClick={() => { if (confirmDelete) onDelete(record); else setConfirmDelete(true); }}>{confirmDelete ? 'Confirm delete' : 'Delete entry'}</button>
          <div className="flex gap-2"><button className="soft-btn" type="button" onClick={() => onEdit(record)}>Edit</button><button className="soft-btn" type="button" onClick={onClose}>Close</button></div>
        </div>

        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <div ref={shareRef} style={{ width: '540px', padding: '40px', background: 'linear-gradient(135deg,#fde5ed,#fff8f4 55%,#eeeafb)', fontFamily: "'DM Sans', sans-serif", color: '#3d3540' }}>
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
