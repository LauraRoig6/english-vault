import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BookMarked, MessageCircle, Link2, Quote, Puzzle, Lightbulb, GitBranch, Brain, Heart, Volume2, X, Trash2, Zap } from 'lucide-react';

function speakWord(text, lang = 'en-US') {
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

const typeMap = {
  vocabulary: 'Vocabulary',
  verbs: 'Verb',
  slang: 'Slang',
  phrasal: 'Phrasal Verb',
  expressions: ['Expression', 'Collocation'],
  idioms: 'Idiom',
  connectors: 'Connector / Linker',
  tricks: 'Grammar / Trick',
};

const headings = {
  verbs: ['Verbs', 'Ordinary lexical verbs, separate from phrasal verbs.'],
  vocabulary: ['Vocabulary', 'Words worth keeping close.'],
  slang: ['Slang', 'Natural, modern and colloquial English.'],
  phrasal: ['Phrasal Verbs', 'Explore meaning, usage and related verbs.'],
  expressions: ['Expressions & Collocations', 'Natural phrases and fixed word combinations.'],
  idioms: ['Idioms', 'Fixed expressions whose meaning is more than the literal words.'],
  connectors: ['Connectors / Linkers', 'Words and phrases that connect ideas and organise discourse.'],
  tricks: ['Tricks', 'Your personal grammar and usage handbook.'],
  favourites: ['Favourites', 'Your saved essentials.'],
};

function Chip({ kind, children, onClick }) {
  const cls = { type: 'chip-type', level: 'chip-level', register: 'chip-register', variety: 'chip-variety', topic: 'chip-topic', status: 'chip-status' }[kind] || 'chip-tag';
  return (
    <span
      className={`chip ${cls}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', transition: 'transform 0.15s' } : {}}
      onMouseEnter={onClick ? (e) => e.currentTarget.style.transform = 'scale(1.06)' : undefined}
      onMouseLeave={onClick ? (e) => e.currentTarget.style.transform = 'scale(1)' : undefined}
    >
      {children}
    </span>
  );
}

// Small edit-distance helper so searches tolerate minor typos (e.g. "bananna" -> "banana").
function editDistance(a = '', b = '') {
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  const prev = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    let left = i;
    let diag = i - 1;
    for (let j = 1; j <= y.length; j++) {
      const up = prev[j];
      const val = x[i - 1] === y[j - 1] ? diag : 1 + Math.min(diag, left, up);
      prev[j] = val;
      diag = up;
      left = val;
    }
  }
  return prev[y.length];
}

function fuzzyTokenMatch(token, candidate) {
  if (!token || !candidate) return false;
  const t = token.toLowerCase();
  const c = candidate.toLowerCase();
  if (c.includes(t)) return true;
  // Do not let tiny words such as “a”, “to” or “on” create false fuzzy matches.
  if (t.length < 3 || c.length < 3) return t === c;
  const maxDist = t.length <= 4 ? 1 : t.length <= 8 ? 2 : 3;
  return editDistance(t, c) <= maxDist;
}

function textHasFuzzyToken(text, token) {
  const value = String(text || '').toLowerCase();
  if (value.includes(token.toLowerCase())) return true;
  const words = value.match(/[a-zà-ÿ'-]+/gi) || [];
  return words.some((w) => fuzzyTokenMatch(token, w));
}


function fuzzyWordMatch(word, query) {
  if (!query) return true;
  const qTokens = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!qTokens.length) return true;
  const wordText = String(word || '').toLowerCase();
  const wordTokens = wordText.match(/[a-zà-ÿ'-]+/gi) || [];
  return qTokens.every((q) => wordText.includes(q) || wordTokens.some((w) => fuzzyTokenMatch(q, w)));
}

function smartSearchMatch(record, query) {
  const raw = String(query || '').trim();
  if (!raw) return true;
  const q = raw.toLowerCase();
  const exactMeta = [record.level, record.register, record.variety, record.status || 'New', record.type, record.topic, record.word_class, record.frequency, record.personal_difficulty]
    .filter(Boolean).some((v) => String(v).toLowerCase() === q);
  const exactTag = String(record.tags || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).includes(q);
  if (exactMeta || exactTag) return true;
  return fuzzyWordMatch(record.word, raw);
}

function attentionReasons(record) {
  const reasons = [];
  if (record.type === 'Grammar / Trick') {
    if (!(record.rule || record.transitive)) reasons.push('Missing rule');
    if (!(record.explanation || record.how_common)) reasons.push('Missing explanation');
    if (!(record.common_mistakes || record.notes)) reasons.push('Missing common mistakes');
    return reasons;
  }
  if (!record.meaning) reasons.push('Missing meaning');
  if (!record.spanish) reasons.push('Missing Spanish');
  if (!record.example) reasons.push('Missing example');
  if (!record.pronunciation_easy) reasons.push('Missing pronunciation');
  if (!record.common_mistakes) reasons.push('Missing common mistakes');
  return reasons;
}

// Highlight exact hits and close fuzzy word hits.
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return <>{text}</>;
  const parts = String(text).split(/(\b[\w'-]+\b)/g);
  return (
    <>
      {parts.map((p, i) => {
        const low = p.toLowerCase();
        const hit = tokens.some((t) => low.includes(t) || fuzzyTokenMatch(t, low));
        return hit && /[\w]/.test(p) ? (
          <mark key={i} style={{ background: '#fff3c9', color: '#85671f', padding: '0 2px', borderRadius: '3px' }}>{p}</mark>
        ) : <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

// Fuzzy search across the whole record; all query tokens must match somewhere.
function fuzzyMatch(record, query) {
  if (!query) return true;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const fields = [
    record.word, record.meaning, record.spanish, record.topic, record.tags,
    record.notes, record.type, record.synonyms, record.related, record.my_example,
    record.example, record.rule, record.explanation, record.level, record.register,
    record.variety, record.status, record.how_common, record.slang_tags,
    record.similar_expressions, record.common_mistakes, record.pattern_structure, record.confused_with, record.usage_warning,
    record.word_class, record.antonyms, record.frequency, record.naturalness_label, record.native_alternative, record.useful_for_exams, record.register_ladder, record.my_mistakes, record.personal_difficulty, record.why_useful, record.false_friend,
  ];
  return tokens.every((t) => fields.some((field) => textHasFuzzyToken(field, t)));
}

function EntryCard({ record, onOpen, onToggleFav, onDelete, query, onTagClick, showAttention, displayMode='cozy', onQuickReview }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const touch = useRef({x:0,y:0,t:0,timer:null});
  const tags = String(record.tags || '').split(',').map((x) => x.trim()).filter(Boolean);
  const isTrick = record.type === 'Grammar / Trick';

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirmDel) {
      onDelete(record);
    } else {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
    }
  };

  return (
    <article
      className={`card entry-card view-${displayMode}`}
      onClick={() => onOpen(record)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), timer: setTimeout(() => setQuickOpen(true), 520) };
      }}
      onTouchMove={() => { if (touch.current.timer) clearTimeout(touch.current.timer); }}
      onTouchEnd={(e) => {
        if (touch.current.timer) clearTimeout(touch.current.timer);
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current.x;
        if (Math.abs(dx) > 70) {
          e.preventDefault();
          if (dx > 0) onToggleFav(record);
          else onQuickReview?.(record);
        }
      }}
    >
      <div style={{ position: 'absolute', right: '15px', top: '15px', display: 'flex', gap: '6px' }}>
        <button
          className={`favourite-toggle ${record.is_favourite ? 'is-fav' : ''}`}
          type="button"
          aria-label="Toggle favourite"
          style={{ position: 'static' }}
          onClick={(e) => { e.stopPropagation(); onToggleFav(record); }}
        >
          <Heart size={16} fill={record.is_favourite ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          aria-label={confirmDel ? 'Confirm delete' : 'Delete entry'}
          title={confirmDel ? 'Click again to confirm' : 'Delete entry'}
          onClick={handleDeleteClick}
          style={{
            width: '33px', height: '33px', border: 0,
            background: confirmDel ? '#f8dce5' : '#fffdfc',
            borderRadius: '10px',
            color: confirmDel ? '#994865' : '#b8a3ad',
            display: 'grid', placeItems: 'center',
            transition: 'background 0.18s, color 0.18s',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="entry-chips flex gap-2 flex-wrap">
        <Chip kind="type" onClick={(e) => { e.stopPropagation(); onTagClick(record.type, 'type'); }}>{record.type}</Chip>
        <Chip kind="status" onClick={(e) => { e.stopPropagation(); onTagClick(record.status || 'New', 'status'); }}>{record.status || 'New'}</Chip>
        {record.level && <Chip kind="level" onClick={(e) => { e.stopPropagation(); onTagClick(record.level, 'level'); }}>{record.level}</Chip>}
        {record.register && <Chip kind="register" onClick={(e) => { e.stopPropagation(); onTagClick(record.register, 'register'); }}>{record.register}</Chip>}
        {record.variety && <Chip kind="variety" onClick={(e) => { e.stopPropagation(); onTagClick(record.variety, 'variety'); }}>{record.variety}</Chip>}
        {record.topic && <Chip kind="topic" onClick={(e) => { e.stopPropagation(); onTagClick(record.topic, 'topic'); }}>{record.topic}</Chip>}
        {tags.map((t, i) => (
          <Chip key={i} kind="tag" onClick={(e) => { e.stopPropagation(); onTagClick(t, 'tag'); }}>{t}</Chip>
        ))}
      </div>
      <h3 className="entry-word"><Highlight text={record.word} query={query} /></h3>
      {(record.pronunciation_easy || record.spanish) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', margin: '-2px 0 10px' }}>
          {record.pronunciation_easy && <span style={{ background: '#f2efff', border: '1px solid #ddd5f2', color: '#6c5f89', padding: '5px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>🗣 {record.pronunciation_easy}</span>}
          {record.spanish && <span style={{ background: '#fff4e7', border: '1px solid #ead8bd', color: '#806a45', padding: '5px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>🇪🇸 {record.spanish}</span>}
        </div>
      )}
      {(record.word_class || record.frequency || record.naturalness_score) && (
        <div className="entry-learning-pills">
          {record.word_class && <span>◌ {record.word_class}</span>}
          {record.frequency && <span>↻ {record.frequency}</span>}
          {record.naturalness_score && <span>🌡 {record.naturalness_score}/5</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); speakWord(record.word, 'en-GB'); }}
          title="British pronunciation"
          style={{ padding: '4px 9px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', border: '1px solid #cddbe6', background: '#eaf4fa', color: '#4e7281', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <Volume2 size={12} /> UK
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); speakWord(record.word, 'en-US'); }}
          title="American pronunciation"
          style={{ padding: '4px 9px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', border: '1px solid #e6d1c0', background: '#fff3c9', color: '#85671f', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <Volume2 size={12} /> US
        </button>
      </div>
      {!isTrick && (
        <p className="entry-meaning text-sm leading-relaxed m-0" style={{ color: '#62596a' }}>
          <Highlight text={record.meaning || record.explanation || 'No meaning added yet.'} query={query} />
        </p>
      )}
      {isTrick && (
        <div className="trick-preview">
          {[['RULE', record.transitive], ['QUICK NOTES', record.how_common], ['EXAMPLES', record.synonyms]]
            .filter(([, v]) => v).map(([label, val]) => (
              <section key={label} className="trick-preview-section">
                <div className="trick-preview-label">{label}</div>
                <p className="trick-preview-text">{val}</p>
              </section>
          ))}
        </div>
      )}
      <div className="entry-bottom flex flex-wrap gap-2 mt-4">
        {record.is_difficult && <Chip kind="type">Difficult</Chip>}
        {record.needs_review && <Chip kind="level">Review</Chip>}
        {showAttention && attentionReasons(record).map((reason) => <span key={reason} className="attention-reason">{reason}</span>)}
      </div>
      {quickOpen && <div className="longpress-menu" onClick={(e)=>e.stopPropagation()}><button onClick={()=>{onOpen(record);setQuickOpen(false)}}>Open</button><button onClick={()=>{onToggleFav(record);setQuickOpen(false)}}>{record.is_favourite?'Unfavourite':'Favourite'}</button><button onClick={()=>{onQuickReview?.(record);setQuickOpen(false)}}>{record.needs_review?'Unmark review':'Review later'}</button><button onClick={()=>setQuickOpen(false)}>Close</button></div>}
    </article>
  );
}

export default function LibraryView({
  records, currentView, librarySpecificType, setLibrarySpecificType,
  tagFilter, setTagFilter, topicFilter, setTopicFilter,
  extraFilter, setExtraFilter,
  search, onSearchChange, onOpenDetail, onToggleFav, onDelete, onNavigate, onOpenCategory, onExport, onImport, onOpenTag, onQuickReview,
}) {
  const [filters, setFilters] = useState({ type: '', level: '', register: '', variety: '', status: '', topic: '', tags: '', semantic_field: '' });
  const [sort, setSort] = useState('newest');
  const [pills, setPills] = useState({ favourite: false, difficult: false, reviewing: false });
  const [displayMode, setDisplayMode] = useState(() => localStorage.getItem('ev-library-view') || 'cozy');
  const [savedSearches, setSavedSearches] = useState(() => { try { return JSON.parse(localStorage.getItem('ev-saved-searches') || '[]'); } catch { return []; } });
  const [saveName, setSaveName] = useState('');
  useEffect(()=>localStorage.setItem('ev-library-view',displayMode),[displayMode]);
  useEffect(()=>localStorage.setItem('ev-saved-searches',JSON.stringify(savedSearches)),[savedSearches]);
  useEffect(() => {
    if (extraFilter?.key !== 'saved_view' || !extraFilter.value) return;
    const v = extraFilter.value;
    setFilters(v.filters || { type:'', level:'', register:'', variety:'', status:'', topic:'', tags:'', semantic_field:'' });
    setPills(v.pills || { favourite:false, difficult:false, reviewing:false });
    setSort(v.sort || 'newest');
    setTagFilter(v.tagFilter || '');
    setTopicFilter(v.topicFilter || '');
    onSearchChange?.(v.search || '');
    // The setters/callback are intentionally omitted: this effect should only run
    // when a saved view is selected, not whenever parent callback identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraFilter]);

  const [title, description] = headings[currentView] || ['Library', ''];
  const isSearching = !!(search && search.trim());
  const hasCross = !!(tagFilter || topicFilter || (extraFilter && extraFilter.value));

  const filtered = useMemo(() => {
    let r = [...records];
    const hasSearch = !!(search && search.trim());
    const hasCrossFilter = !!(tagFilter || topicFilter || (extraFilter && extraFilter.value));
    // When there's a search query OR a cross-cutting chip filter (tag/topic/level/etc),
    // search across ALL entries. Otherwise honour the current library section filter.
    if (!hasSearch && !hasCrossFilter) {
      if (librarySpecificType) {
        r = r.filter((x) => x.type === librarySpecificType);
      } else if (currentView && currentView !== 'favourites') {
        const m = typeMap[currentView];
        if (m) r = r.filter((x) => (Array.isArray(m) ? m.includes(x.type) : x.type === m));
      }
      if (currentView === 'favourites') r = r.filter((x) => x.is_favourite);
    }
    if (tagFilter) {
      const tt = tagFilter.toLowerCase();
      r = r.filter((x) => String(x.tags || '').toLowerCase().split(',').map((z) => z.trim()).includes(tt));
    }
    if (topicFilter) {
      const tt = topicFilter.toLowerCase();
      r = r.filter((x) => String(x.topic || '').toLowerCase() === tt);
    }
    if (extraFilter && extraFilter.value) {
      const { key, value } = extraFilter;
      if (key === 'saved_view') { /* local filter state already restored above */ }
      else if (key === 'status') r = r.filter((x) => (x.status || 'New') === value);
      else if (key === 'needs_attention') r = r.filter((x) => {
        if (x.type === 'Grammar / Trick') return !(x.rule || x.transitive) || !(x.explanation || x.how_common) || !(x.common_mistakes || x.notes);
        return !x.meaning || !x.spanish || !x.example || !x.common_mistakes || !x.pronunciation_easy;
      });
      else if (key === 'smart_collection') {
        const now = Date.now();
        if (value === 'formal-writing') r = r.filter((x) => x.register === 'Formal' || /writing|essay/i.test(`${x.best_for || ''} ${x.useful_for_exams || ''}`));
        else if (value === 'confusable') r = r.filter((x) => !!String(x.confused_with || x.my_mistakes || '').trim());
        else if (value === 'hard') r = r.filter((x) => x.is_difficult || x.personal_difficulty === 'Hard');
        else if (value === 'forgotten') r = r.filter((x) => {
          const last = new Date(x.last_reviewed_at || x.created_at || 0).getTime();
          return last && (now - last) > 30 * 24 * 60 * 60 * 1000 && !x.is_known;
        });
      }
      else r = r.filter((x) => (x[key] || '') === value);
    }
    if (search && search.trim()) r = r.filter((x) => smartSearchMatch(x, search));

    Object.entries(filters).forEach(([k, v]) => {
      if (!v) return;
      if (['topic', 'tags'].includes(k)) {
        r = r.filter((x) => String(x[k] || '').toLowerCase().includes(v.toLowerCase()));
      } else if (k === 'status') {
        r = r.filter((x) => (x.status || 'New') === v);
      } else {
        r = r.filter((x) => x[k] === v);
      }
    });
    if (pills.favourite) r = r.filter((x) => x.is_favourite);
    if (pills.difficult) r = r.filter((x) => x.is_difficult);
    if (pills.reviewing) r = r.filter((x) => x.needs_review);

    const dv = (x) => new Date(x.created_at || 0).getTime();
    r.sort((a, b) => {
      if (sort === 'oldest') return dv(a) - dv(b);
      if (sort === 'alpha') return String(a.word).localeCompare(String(b.word));
      if (sort === 'reviewed') return (b.review_count || 0) - (a.review_count || 0);
      return dv(b) - dv(a);
    });
    return r;
  }, [records, currentView, librarySpecificType, tagFilter, topicFilter, extraFilter, search, filters, sort, pills]);

  const clearFilters = () => {
    setFilters({ type: '', level: '', register: '', variety: '', status: '', topic: '', tags: '', semantic_field: '' });
    setPills({ favourite: false, difficult: false, reviewing: false });
    setTagFilter('');
    setTopicFilter('');
    if (setExtraFilter) setExtraFilter(null);
  };

  const handleTagClick = (value, kind) => {
    if (kind === 'topic') setTopicFilter(value);
    else if (kind === 'tag') onOpenTag(value);
    else if (kind === 'type') {
      if (value === 'Idiom') onNavigate('idioms');
      else if (['Expression', 'Collocation'].includes(value)) onOpenCategory(value);
      else { const map = { 'Vocabulary': 'vocabulary', 'Verb': 'verbs', 'Slang': 'slang', 'Phrasal Verb': 'phrasal', 'Connector / Linker': 'connectors', 'Grammar / Trick': 'tricks' }; if (map[value]) onNavigate(map[value]); }
    } else if (setExtraFilter) setExtraFilter({ key: kind, value });
  };

  const saveCurrentSearch = () => {
    const name = saveName.trim() || `Saved view ${savedSearches.length + 1}`;
    setSavedSearches((x)=>[...x.filter(v=>v.name!==name), {name,filters,pills,sort,tagFilter,topicFilter,search}]); setSaveName('');
  };
  const applySavedSearch = (v) => { setFilters(v.filters||{}); setPills(v.pills||{}); setSort(v.sort||'newest'); setTagFilter(v.tagFilter||''); setTopicFilter(v.topicFilter||''); onSearchChange?.(v.search||''); };

  const mobileCats = [
    { id: 'vocabulary', label: 'Vocabulary', icon: BookMarked },
    { id: 'verbs', label: 'Verbs', icon: Zap },
    { id: 'slang', label: 'Slang', icon: MessageCircle },
    { id: 'phrasal', label: 'Phrasal Verbs', icon: Link2 },
    { id: 'expression', label: 'Expressions', icon: Quote },
    { id: 'collocation', label: 'Collocations', icon: Puzzle },
    { id: 'idioms', label: 'Idioms', icon: Lightbulb },
    { id: 'connectors', label: 'Connectors', icon: GitBranch },
    { id: 'tricks', label: 'Tricks', icon: Brain },
    { id: 'favourites', label: 'Favourites', icon: Heart },
  ];

  return (
    <section className="view active">
      <div className="mb-7">
        <p className="eyebrow">{isSearching ? 'Search results' : (hasCross ? 'Filtered across your vault' : 'Your library')}</p>
        <h2 className="page-title">{isSearching ? `Results for “${search.trim()}”` : (hasCross ? 'All matching entries' : (librarySpecificType ? `${librarySpecificType}s` : title))}</h2>
        <p className="mt-3" style={{ color: '#726773' }}>{isSearching || hasCross ? 'Showing matches across your whole vault.' : description}</p>
      </div>

      <nav className="mobile-category-menu" aria-label="Library categories">
        {mobileCats.map((c) => {
          const Icon = c.icon;
          const isActive = (['expression', 'collocation'].includes(c.id) && librarySpecificType && librarySpecificType.toLowerCase() === c.id) || currentView === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={isActive ? 'active' : ''}
              onClick={() => {
                if (['expression', 'collocation'].includes(c.id)) {
                  onOpenCategory(c.id[0].toUpperCase() + c.id.slice(1));
                } else {
                  onNavigate(c.id);
                }
              }}
            >
              <Icon size={14} />{c.label}
            </button>
          );
        })}
      </nav>

      <div className="mobile-category-select-wrap">
        <span className="mobile-category-select-label">Library section</span>
        <select
          className="mobile-category-select"
          value={librarySpecificType ? librarySpecificType.toLowerCase() : currentView}
          onChange={(e) => {
            const value = e.target.value;
            if (['expression', 'collocation'].includes(value)) onOpenCategory(value[0].toUpperCase() + value.slice(1));
            else onNavigate(value);
          }}
        >
          {mobileCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Active filter chips */}
      {(tagFilter || topicFilter || (extraFilter && extraFilter.value)) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {topicFilter && (
            <span className="chip chip-topic inline-flex items-center gap-1" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Topic: {topicFilter}
              <button type="button" onClick={() => setTopicFilter('')} aria-label="Remove topic" style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0, marginLeft: '4px', display: 'inline-flex' }}>
                <X size={13} />
              </button>
            </span>
          )}
          {tagFilter && (
            <span className="chip chip-tag inline-flex items-center gap-1" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Tag: {tagFilter}
              <button type="button" onClick={() => setTagFilter('')} aria-label="Remove tag" style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0, marginLeft: '4px', display: 'inline-flex' }}>
                <X size={13} />
              </button>
            </span>
          )}
          {extraFilter && extraFilter.value && (
            <span className={`chip chip-${extraFilter.key === 'level' ? 'level' : extraFilter.key === 'register' ? 'register' : extraFilter.key === 'variety' ? 'variety' : extraFilter.key === 'needs_attention' ? 'type' : 'status'} inline-flex items-center gap-1`} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              {extraFilter.key === 'needs_attention' ? 'Needs attention' : extraFilter.key === 'smart_collection' ? `Collection: ${extraFilter.value.replace(/-/g,' ')}` : extraFilter.key === 'saved_view' ? `Pinned: ${extraFilter.value?.name || 'saved view'}` : `${extraFilter.key.charAt(0).toUpperCase() + extraFilter.key.slice(1)}: ${extraFilter.value}`}
              <button type="button" onClick={() => setExtraFilter && setExtraFilter(null)} aria-label="Remove filter" style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0, marginLeft: '4px', display: 'inline-flex' }}>
                <X size={13} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="field"><label>TYPE</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All types</option>
              {['Vocabulary', 'Verb', 'Slang', 'Phrasal Verb', 'Expression', 'Collocation', 'Idiom', 'Connector / Linker', 'Grammar / Trick'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>LEVEL</label>
            <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
              <option value="">All levels</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native-like'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>REGISTER</label>
            <select value={filters.register} onChange={(e) => setFilters({ ...filters, register: e.target.value })}>
              <option value="">All registers</option>
              {['Formal', 'Neutral', 'Informal', 'Slang'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>VARIETY</label>
            <select value={filters.variety} onChange={(e) => setFilters({ ...filters, variety: e.target.value })}>
              <option value="">All varieties</option>
              {['British English', 'American English', 'Both'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>STATUS</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {['New', 'Learning', 'Almost learnt', 'Mastered'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>TOPIC</label>
            <input value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} placeholder="Any topic" />
          </div>
          <div className="field"><label>TAGS</label>
            <input value={filters.tags} onChange={(e) => setFilters({ ...filters, tags: e.target.value })} placeholder="Any tag" />
          </div>
          <div className="field"><label>SEMANTIC FIELD</label>
            <input value={filters.semantic_field || ''} onChange={(e) => setFilters({ ...filters, semantic_field: e.target.value })} placeholder="e.g. confusion" />
          </div>
          <div className="field"><label>SORT BY</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alpha">Alphabetical</option>
              <option value="reviewed">Most reviewed</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="soft-btn text-xs py-2" style={pills.favourite ? { background: '#fbe4ec', borderColor: '#d986a5', color: '#9d4f6e' } : {}} onClick={() => setPills({ ...pills, favourite: !pills.favourite })}>★ Favourites</button>
          <button className="soft-btn text-xs py-2" style={pills.difficult ? { background: '#fbe4ec', borderColor: '#d986a5', color: '#9d4f6e' } : {}} onClick={() => setPills({ ...pills, difficult: !pills.difficult })}>⚠ Difficult</button>
          <button className="soft-btn text-xs py-2" style={pills.reviewing ? { background: '#fbe4ec', borderColor: '#d986a5', color: '#9d4f6e' } : {}} onClick={() => setPills({ ...pills, reviewing: !pills.reviewing })}>↻ Need to review</button>
          <button className="text-xs font-bold px-2 bg-transparent border-0" style={{ color: '#9d4f6e', cursor: 'pointer' }} onClick={clearFilters}>Clear filters</button>
        </div>
        <div className="library-tools mt-4"><div className="view-switch"><span>Card view</span>{['cozy','compact'].map(v=><button key={v} className={displayMode===v?'active':''} onClick={()=>setDisplayMode(v)}>{v}</button>)}</div><div className="saved-searches"><input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="Name this filter view"/><button className="soft-btn" type="button" onClick={saveCurrentSearch}>Save filters</button>{savedSearches.map((v,i)=><span key={v.name}><button type="button" className="saved-view-chip" onClick={()=>applySavedSearch(v)}>{v.name}</button><button className="saved-view-x" onClick={()=>setSavedSearches(x=>x.filter((_,j)=>j!==i))}>×</button></span>)}</div></div>
      </div>

      <div className={`grid ${displayMode==='compact'?'sm:grid-cols-2 xl:grid-cols-4':'sm:grid-cols-2 xl:grid-cols-3'} gap-4 ${currentView === 'tricks' ? 'tricks-layout' : ''}`}>
        {filtered.length === 0 ? (
          <div className="empty-box sm:col-span-2 xl:col-span-3">No entries match this view yet. Add a new discovery to begin.</div>
        ) : filtered.map((r) => (
          <EntryCard key={r.__backendId} record={r} onOpen={onOpenDetail} onToggleFav={onToggleFav} onDelete={onDelete} query={search} onTagClick={handleTagClick} showAttention={extraFilter?.key === 'needs_attention'} displayMode={displayMode} onQuickReview={onQuickReview} />
        ))}
      </div>

      <section className="card p-5 mt-7">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <div>
            <p className="eyebrow">Backup and restore</p>
            <h2 className="section-heading">Data</h2>
            <p className="text-sm mt-1" style={{ color: '#726773' }}>Export your vault or add entries from a previous export.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="soft-btn" type="button" onClick={onExport}>Export Vault</button>
            <label className="primary-btn cursor-pointer">
              Import Vault
              <input type="file" accept="application/json" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ''; } }} />
            </label>
          </div>
        </div>
      </section>
    </section>
  );
}
