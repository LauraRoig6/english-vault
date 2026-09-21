import React, { useState, useMemo, useEffect } from 'react';

const today = () => new Date().toISOString().slice(0, 10);
const isDue = (r) => !r.next_review_at || String(r.next_review_at).slice(0, 10) <= today();

const categories = [
  { id: 'all', label: 'All entries' },
  { id: 'Vocabulary', label: 'Vocabulary' },
  { id: 'Slang', label: 'Slang' },
  { id: 'Phrasal Verb', label: 'Phrasal Verbs' },
  { id: 'Expression', label: 'Expressions' },
  { id: 'Collocation', label: 'Collocations' },
  { id: 'Connector / Linker', label: 'Connectors / Linkers' },
  { id: 'Idiom', label: 'Idioms' },
];

const modes = [
  { id: 'flashcards', title: 'Flashcards', sub: 'Reveal and rate' },
  { id: 'multiple', title: 'Multiple Choice', sub: 'Choose the answer' },
  { id: 'write', title: 'Write the Answer', sub: 'Recall in your words' },
  { id: 'en-es', title: 'English → Spanish', sub: 'Translate it' },
  { id: 'es-en', title: 'Spanish → English', sub: 'Translate it back' },
];

function Chip({ kind, children }) {
  const cls = { type: 'chip-type', level: 'chip-level', register: 'chip-register', variety: 'chip-variety', topic: 'chip-topic', status: 'chip-status' }[kind] || 'chip-tag';
  return <span className={`chip ${cls}`}>{children}</span>;
}

function metaChips(r) {
  return [['type', r.type], ['status', r.status || 'New'], ['level', r.level], ['register', r.register], ['variety', r.variety], ['topic', r.topic]]
    .filter(([, v]) => v)
    .map(([k, v], i) => <Chip key={i} kind={k}>{v}</Chip>);
}

const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

export default function PracticeView({ records, onUpdate, onToast, focusRecords = [], focusToken = 0 }) {
  const [category, setCategory] = useState('all');
  const [flags, setFlags] = useState({ favourite: false, difficult: false, review: false, due: false });
  const [mode, setMode] = useState('flashcards');
  const [session, setSession] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAns, setSelectedAns] = useState(null);
  const [multipleFeedback, setMultipleFeedback] = useState('');
  const [writeAnswer, setWriteAnswer] = useState('');
  const [writeFeedback, setWriteFeedback] = useState('');
  const [showRating, setShowRating] = useState(false);

  const filteredRecords = useMemo(() => {
    let r = records.filter((x) => !x.is_known);
    if (category !== 'all') r = r.filter((x) => x.type === category);
    if (flags.favourite) r = r.filter((x) => x.is_favourite);
    if (flags.difficult) r = r.filter((x) => x.is_difficult);
    if (flags.review) r = r.filter((x) => x.needs_review);
    if (flags.due) r = r.filter(isDue);
    return r;
  }, [records, category, flags]);

  const start = () => {
    if (!filteredRecords.length) return;
    setSession([...filteredRecords].sort(() => Math.random() - 0.5));
    setIndex(0);
    resetCard();
  };

  const resetCard = () => {
    setFlipped(false);
    setSelectedAns(null);
    setMultipleFeedback('');
    setWriteAnswer('');
    setWriteFeedback('');
    setShowRating(false);
  };

  const exitSession = () => { setSession([]); setIndex(0); resetCard(); };

  useEffect(() => {
    if (!focusToken || !focusRecords.length) return;
    setMode(focusRecords.length === 1 ? 'multiple' : 'flashcards');
    setSession([...focusRecords]);
    setIndex(0);
    setFlipped(false); setSelectedAns(null); setMultipleFeedback(''); setWriteAnswer(''); setWriteFeedback(''); setShowRating(false);
  }, [focusToken, focusRecords]);

  const current = session[index];

  const answerText = (r, m) => {
    if (!r) return '';
    if (m === 'en-es') return r.spanish || r.meaning || '';
    if (m === 'es-en') return r.word || '';
    return r.meaning || r.spanish || r.explanation || '';
  };
  const promptText = (r, m) => {
    if (!r) return '';
    if (m === 'en-es') return r.word;
    if (m === 'es-en') return r.spanish || r.meaning || r.word;
    return r.word;
  };

  const multipleOptions = useMemo(() => {
    if (mode !== 'multiple' || !current) return [];
    const correct = answerText(current, mode);
    const set = new Map();
    [correct, ...records.filter((x) => x.__backendId !== current.__backendId).map((x) => answerText(x, mode))]
      .filter(Boolean).forEach((x) => { if (!set.has(norm(x))) set.set(norm(x), x); });
    return [...set.values()].slice(0, 4).sort(() => Math.random() - 0.5);
  }, [current, mode, records]);

  const rate = (rating) => {
    if (!current) return;
    const days = { again: 1, hard: 2, good: 5, easy: 10 }[rating];
    const status = { again: 'Learning', hard: 'Learning', good: 'Almost learnt', easy: 'Mastered' }[rating];
    const scoreDelta = { again: -2, hard: -1, good: 1, easy: 2 }[rating];
    const next = new Date();
    next.setDate(next.getDate() + days);
    onUpdate({
      ...current,
      review_count: (current.review_count || 0) + 1,
      review_score: Math.max(0, (current.review_score || 0) + scoreDelta),
      status,
      needs_review: rating !== 'easy',
      is_known: rating === 'easy',
      last_reviewed_at: new Date().toISOString(),
      next_review_at: next.toISOString(),
    });
    if (index + 1 >= session.length) {
      onToast('Practice session complete — lovely work!');
      exitSession();
    } else {
      setIndex(index + 1);
      resetCard();
    }
  };

  // Setup screen
  if (!session.length) {
    return (
      <section className="view active">
        <div className="mb-7">
          <p className="eyebrow">Gentle recall practice</p>
          <h2 className="page-title">Practice</h2>
          <p className="mt-3" style={{ color: '#726773' }}>What do you want to practise today?</p>
        </div>

        <section className="card p-5 mb-5">
          <h3 className="section-heading">Choose what to study</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {categories.map((c) => (
              <button key={c.id} className={`filter-choice ${category === c.id ? 'selected' : ''}`} type="button" onClick={() => setCategory(c.id)}>{c.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            {[['favourite', '⭐ Favourites only'], ['difficult', '⚠ Difficult only'], ['review', '↻ Need to review'], ['due', '⏰ Due today']].map(([k, label]) => (
              <button key={k} className={`soft-btn text-sm ${flags[k] ? 'selected' : ''}`} style={flags[k] ? { background: '#fbe4ec', borderColor: '#d986a5', color: '#9d4f6e' } : {}} onClick={() => setFlags({ ...flags, [k]: !flags[k] })}>{label}</button>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="section-heading">Choose a practice mode</h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 mt-4">
            {modes.map((m) => (
              <button key={m.id} className={`mode-card ${mode === m.id ? 'selected' : ''}`} type="button" onClick={() => setMode(m.id)}>
                <strong>{m.title}</strong>
                <span className="block text-xs">{m.sub}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button className="primary-btn" type="button" onClick={start} disabled={!filteredRecords.length}>Start practice</button>
          </div>
          {!filteredRecords.length && (
            <p className="text-sm mt-3" style={{ color: '#a94f73' }}>No entries match these filters yet.</p>
          )}
        </section>
      </section>
    );
  }

  const correctAns = answerText(current, mode);

  return (
    <section className="view active">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <p className="eyebrow">Practice session</p>
            <p className="font-bold m-0">{index + 1} / {session.length}</p>
          </div>
          <div className="flex gap-2">
            <button className="soft-btn text-sm" onClick={() => { setSession([...session].sort(() => Math.random() - 0.5)); setIndex(0); resetCard(); }}>Shuffle</button>
            <button className="soft-btn text-sm" onClick={exitSession}>Exit practice</button>
          </div>
        </div>

        <div className="progress-track mb-6">
          <div className="progress-fill" style={{ width: `${((index + 1) / session.length) * 100}%` }} />
        </div>

        {mode === 'flashcards' && (
          <div
            className={`practice-card ${flipped ? 'flipped' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => { setFlipped(!flipped); if (!flipped) setShowRating(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(!flipped); if (!flipped) setShowRating(true); } }}
          >
            <div className="flash-inner">
              <div className="flash-face flash-front">
                <div className="flex flex-wrap justify-center gap-2 mb-7">{metaChips(current)}</div>
                <h3 className="flash-word">{current.word}</h3>
                <p className="mt-6 font-semibold">Tap to reveal</p>
              </div>
              <div className="flash-face flash-back">
                <h3 className="flash-word">{current.word}</h3>
                <div className="mt-5 max-w-xl space-y-3">
                  {[['Meaning', current.meaning || current.explanation], ['Spanish', current.spanish], ['Example', current.example], ['My example', current.my_example]]
                    .filter(([, v]) => v).map(([l, v]) => (
                      <p key={l}><strong>{l}:</strong> {v}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'multiple' && (
          <div className="card p-6">
            <div className="flex flex-wrap gap-2 mb-6">{metaChips(current)}</div>
            <h3 className="section-heading mb-5">{promptText(current, mode)}</h3>
            <div className="grid gap-3">
              {multipleOptions.map((o, i) => {
                let cls = 'answer-option';
                if (selectedAns !== null) {
                  if (norm(o) === norm(correctAns)) cls += ' correct';
                  else if (i === selectedAns) cls += ' wrong';
                }
                return (
                  <button key={i} className={cls} type="button" disabled={selectedAns !== null}
                    onClick={() => {
                      setSelectedAns(i);
                      const ok = norm(o) === norm(correctAns);
                      setMultipleFeedback(ok ? 'Correct — great recall!' : `Suggested answer: ${correctAns}`);
                      setShowRating(true);
                    }}>{o}</button>
                );
              })}
            </div>
            <p className="mt-4 font-bold">{multipleFeedback}</p>
          </div>
        )}

        {(mode === 'write' || mode === 'en-es' || mode === 'es-en') && (
          <form className="card p-6" onSubmit={(e) => {
            e.preventDefault();
            const translation = ['es-en', 'en-es'].includes(mode);
            const ok = translation && norm(writeAnswer) === norm(correctAns);
            setWriteFeedback(ok ? 'Correct — great recall!' : translation ? `Suggested answer: ${correctAns}` : `Compare your answer with: ${correctAns}`);
            setShowRating(true);
          }}>
            <div className="flex flex-wrap gap-2 mb-6">{metaChips(current)}</div>
            <h3 className="section-heading mb-5">{promptText(current, mode)}</h3>
            <input
              className="w-full border rounded-xl p-3"
              style={{ borderColor: '#e8d8df', font: 'inherit' }}
              placeholder="Type your answer…"
              value={writeAnswer}
              onChange={(e) => setWriteAnswer(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button className="primary-btn" type="submit">Check answer</button>
              <button className="soft-btn" type="button" onClick={() => { setWriteFeedback(`Suggested answer: ${correctAns}`); setShowRating(true); }}>Reveal answer</button>
            </div>
            <p className="mt-4 font-bold">{writeFeedback}</p>
          </form>
        )}

        {showRating && (
          <div className="mt-5 flex flex-wrap gap-3">
            {[['again', 'Again'], ['hard', 'Hard'], ['good', 'Good'], ['easy', 'Easy']].map(([k, label]) => (
              <button key={k} className={`rating-btn rating-${k}`} type="button" onClick={() => rate(k)}>{label}</button>
            ))}
          </div>
        )}

        <button className="w-full mt-4 text-sm font-bold bg-transparent border-0" style={{ color: '#9d4f6e' }} onClick={() => {
          if (index + 1 >= session.length) exitSession();
          else { setIndex(index + 1); resetCard(); }
        }}>Skip for now →</button>
      </div>
    </section>
  );
}
