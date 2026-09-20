import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Heart, Volume2, Share2, Download } from 'lucide-react';


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
      <button type="button" onClick={() => speak(text, 'en-GB')} className="soft-btn"
        title="British pronunciation"
        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
        <Volume2 size={14} /> UK
      </button>
      <button type="button" onClick={() => speak(text, 'en-US')} className="soft-btn"
        title="American pronunciation"
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

export default function DetailModal({ record, onClose, onEdit, onDelete, onToggleFav, onUpdate, onTagClick }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shareRef = useRef(null);

  if (!record) return null;

  const meta = [
    ['type', record.type],
    ['status', record.status || 'New'],
    ['level', record.level],
    ['register', record.register],
    ['variety', record.variety],
    ['topic', record.topic],
    ...String(record.tags || '').split(',').map((x) => ['tag', x.trim()]),
  ].filter(([, v]) => v);

  const isTrick = record.type === 'Grammar / Trick';

  const fields = isTrick ? [
    ['Trick category', record.separable],
    ['Rule', record.transitive],
    ['Explanation', record.how_common],
    ['Examples', record.synonyms],
    ['Exceptions', record.offensive_warning],
    ['Memory trick', record.related],
    ['Common mistakes', record.notes],
  ] : [
    ['Meaning', record.meaning],
    ['Spanish', record.spanish],
    ['Natural example', record.example],
    ['My example', record.my_example],
    ['Notes', record.notes],
    ['Synonyms', record.synonyms],
    ['Related expressions', record.related],
    ['Related phrasal verbs', record.similar_expressions],
    ['Separable', record.separable],
    ['Transitivity', record.transitive],
    ['How common', record.how_common],
    ['Usage warning', record.offensive_warning],
    ['Slang tags', record.slang_tags],
  ];


  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');

      // Try native Web Share API first
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${record.word.replace(/[^\w-]/g, '_')}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: record.word, text: `${record.word} — from English Vault` });
          return;
        }
      } catch (err) { /* fall through to download */ }

      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${record.word.replace(/[^\w-]/g, '_')}-english-vault.png`;
      a.click();
    } catch (e) {
      console.error('share failed', e);
    }
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
            <button className="soft-btn p-2" type="button" aria-label="Toggle favourite" onClick={() => onToggleFav(record)} style={{ color: record.is_favourite ? '#b54f75' : '#887583' }}>
              <Heart size={18} fill={record.is_favourite ? 'currentColor' : 'none'} />
            </button>
            <button className="soft-btn p-2" type="button" onClick={handleShare} aria-label="Share as image" title="Share as image">
              <Share2 size={18} />
            </button>
            <button className="soft-btn p-2" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {meta.map(([k, v], i) => {
            const clickable = onTagClick && ['tag', 'topic', 'level', 'register', 'variety', 'status', 'type'].includes(k);
            return (
              <span key={i}
                onClick={clickable ? () => onTagClick(v, k) : undefined}
                style={clickable ? { cursor: 'pointer', display: 'inline-block', transition: 'transform 0.15s' } : {}}
                title={clickable ? `Filter by ${v}` : undefined}
                onMouseEnter={clickable ? (e) => e.currentTarget.style.transform = 'scale(1.06)' : undefined}
                onMouseLeave={clickable ? (e) => e.currentTarget.style.transform = 'scale(1)' : undefined}>
                <Chip kind={k}>{v}</Chip>
              </span>
            );
          })}
        </div>


        <div className="grid md:grid-cols-2 gap-5 mt-7">
          {fields.filter(([, v]) => v).map(([label, value]) => (
            <section key={label} className="rounded-2xl p-4" style={{ background: '#fff7fa' }}>
              <p className="text-xs font-bold tracking-widest m-0" style={{ color: '#9a7180' }}>{label}</p>
              <p className="leading-relaxed mt-2 whitespace-pre-line m-0">{value}</p>
            </section>
          ))}
        </div>

        <div className="mt-7 pt-5 border-t flex flex-wrap justify-between gap-3" style={{ borderColor: '#e8d8df' }}>
          <button className="text-sm font-bold px-2 bg-transparent border-0" style={{ color: '#b44c70', cursor: 'pointer' }} type="button"
            onClick={() => { if (confirmDelete) onDelete(record); else setConfirmDelete(true); }}>
            {confirmDelete ? 'Confirm delete' : 'Delete entry'}
          </button>
          <div className="flex gap-2">
            <button className="soft-btn" type="button" onClick={() => onEdit(record)}>Edit</button>
            <button className="soft-btn" type="button" onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Hidden share card (rendered offscreen but captured by html2canvas) */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <div ref={shareRef} style={{ width: '540px', padding: '40px', background: 'linear-gradient(135deg,#fde5ed,#fff8f4 55%,#eeeafb)', fontFamily: "'DM Sans', sans-serif", color: '#3d3540' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a46880', margin: 0 }}>English Vault ✦</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '3.4rem', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.03em', margin: '10px 0 6px', color: '#3d3540' }}>{record.word}</h1>
            <p style={{ fontSize: '0.85rem', color: '#a46880', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 20px' }}>{record.type}{record.level ? ` · ${record.level}` : ''}</p>
            {record.meaning && (
              <div style={{ background: 'rgba(255,255,255,0.68)', borderRadius: '18px', padding: '18px', marginTop: '10px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#9a7180', margin: 0 }}>MEANING</p>
                <p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{record.meaning}</p>
              </div>
            )}
            {record.spanish && (
              <div style={{ background: 'rgba(233,227,250,0.7)', borderRadius: '18px', padding: '18px', marginTop: '12px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#655782', margin: 0 }}>ESPAÑOL</p>
                <p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{record.spanish}</p>
              </div>
            )}
            {record.example && (
              <div style={{ background: 'rgba(255,243,201,0.75)', borderRadius: '18px', padding: '18px', marginTop: '12px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#85671f', margin: 0 }}>EXAMPLE</p>
                <p style={{ margin: '6px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{record.example}&rdquo;</p>
              </div>
            )}
            <p style={{ marginTop: '28px', fontSize: '0.75rem', color: '#a46880', fontWeight: 700, letterSpacing: '0.1em' }}>SAVED IN MY ENGLISH VAULT</p>
          </div>
        </div>
      </article>
    </div>
  );
}
