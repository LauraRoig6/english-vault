import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Volume2 } from 'lucide-react';

function speak(text, lang) {
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
}

export default function SurpriseDiscoveryModal({ suggestion, loading, error, onClose, onAnother, onSeeMore }) {
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState('');

  const handleSeeMore = async () => {
    if (!suggestion || expanding) return;
    setExpanding(true);
    setExpandError('');
    try {
      await onSeeMore(suggestion);
    } catch (err) {
      setExpandError(err?.message || 'Could not generate the full entry.');
    } finally {
      setExpanding(false);
    }
  };

  return (
    <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <article className="modal-panel p-6 md:p-8" style={{ width: 'min(720px,100%)' }}>
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="eyebrow">A NEW DISCOVERY ✦</p>
            <h2 className="section-heading">Surprise me</h2>
          </div>
          <button className="soft-btn p-2" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="empty-box mt-6">
            <Sparkles size={24} style={{ margin: '0 auto 10px' }} />
            <p className="m-0 font-semibold">Finding something new for you…</p>
          </div>
        ) : error ? (
          <div className="empty-box mt-6">
            <p className="m-0">{error}</p>
            <button className="soft-btn mt-4" type="button" onClick={onAnother}>Try again</button>
          </div>
        ) : suggestion ? (
          <>
            <div className="hero-panel mt-6" style={{ padding: '30px' }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="chip chip-type">{suggestion.type}</span>
                {suggestion.level && <span className="chip chip-level">{suggestion.level}</span>}
                {suggestion.variety && <span className="chip chip-variety">{suggestion.variety}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="page-title" style={{ marginRight: '6px' }}>{suggestion.word}</h2>
                <button className="soft-btn text-xs" type="button" onClick={() => speak(suggestion.word, 'en-GB')}><Volume2 size={14} style={{ display: 'inline', marginRight: 4 }} />UK</button>
                <button className="soft-btn text-xs" type="button" onClick={() => speak(suggestion.word, 'en-US')}><Volume2 size={14} style={{ display: 'inline', marginRight: 4 }} />US</button>
              </div>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: '#62596a' }}>{suggestion.teaser}</p>
              {suggestion.spanish && <p className="mt-3"><strong>Spanish:</strong> {suggestion.spanish}</p>}
              {suggestion.example && <p className="mt-3" style={{ fontStyle: 'italic' }}>“{suggestion.example}”</p>}
            </div>

            <p className="text-sm mt-5" style={{ color: '#726773' }}>
              Curious? Generate the complete entry first. Nothing will be saved until you press Save entry.
            </p>
            {expandError && <p className="text-sm mt-3" style={{ color: '#a94f73' }}>{expandError}</p>}

            <div className="flex flex-wrap justify-between gap-3 mt-6">
              <button className="soft-btn inline-flex gap-2 items-center" type="button" onClick={onAnother} disabled={expanding}>
                <RefreshCw size={16} /> Another surprise
              </button>
              <button className="primary-btn inline-flex gap-2 items-center" type="button" onClick={handleSeeMore} disabled={expanding}>
                <Sparkles size={16} /> {expanding ? 'Generating full entry…' : 'See full info'}
              </button>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
