import React, { useMemo, useState } from 'react';
import { BookMarked, MessageCircle, Link2, Quote, Puzzle, Lightbulb, GitBranch, Brain, Heart, Volume2, X, Trash2 } from 'lucide-react';

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
  slang: 'Slang',
  phrasal: 'Phrasal Verb',
  expressions: ['Expression', 'Collocation', 'Idiom'],
  connectors: 'Connector / Linker',
  tricks: 'Grammar / Trick',
};

const headings = {
  vocabulary: ['Vocabulary', 'Words worth keeping close.'],
  slang: ['Slang', 'Natural, modern and colloquial English.'],
  phrasal: ['Phrasal Verbs', 'Explore meaning, usage and related verbs.'],
  expressions: ['Expressions & Collocations', 'The combinations that make English sound natural.'],
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
  if (c.includes(t) || t.includes(c)) return true;
  const maxDist = t.length <= 4 ? 1 : t.length <= 8 ? 2 : 3;
  return editDistance(t, c) <= maxDist;
}

function textHasFuzzyToken(text, token) {
  const value = String(text || '').toLowerCase();
  if (value.includes(token.toLowerCase())) return true;
  const words = value.match(/[a-zà-ÿ'-]+/gi) || [];
  return words.some((w) => fuzzyTokenMatch(token, w));
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
    record.similar_expressions,
  ];
  return tokens.every((t) => fields.some((field) => textHasFuzzyToken(field, t)));
}

function EntryCard({ record, onOpen, onToggleFav, onDelete, query, onTagClick }) {
  const [confirmDel, setConfirmDel] = useState(false);
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
    <article className="card entry-card" onClick={() => onOpen(record)}>
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
        <Chip kind="type">{record.type}</Chip>
        <Chip kind="status">{record.status || 'New'}</Chip>
        {record.level && <Chip kind="level">{record.level}</Chip>}
        {record.register && <Chip kind="register">{record.register}</Chip>}
        {record.variety && <Chip kind="variety">{record.variety}</Chip>}
        {record.topic && <Chip kind="topic" onClick={(e) => { e.stopPropagation(); onTagClick(record.topic, 'topic'); }}>{record.topic}</Chip>}
        {tags.map((t, i) => (
          <Chip key={i} kind="tag" onClick={(e) => { e.stopPropagation(); onTagClick(t, 'tag'); }}>{t}</Chip>
        ))}
      </div>
      <h3 className="entry-word"><Highlight text={record.word} query={query} /></h3>
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
      </div>
    </article>
  );
}

export default function LibraryView({
  records, currentView, librarySpecificType, setLibrarySpecificType,
  tagFilter, setTagFilter, topicFilter, setTopicFilter,
  extraFilter, setExtraFilter,
  search, onOpenDetail, onToggleFav, onDelete, onNavigate, onOpenCategory, onExport, onImport, onOpenTag,
}) {
  const [filters, setFilters] = useState({ level: '', register: '', variety: '', status: '', topic: '', tags: '' });
  const [sort, setSort] = useState('newest');
  const [pills, setPills] = useState({ favourite: false, difficult: false, reviewing: false });

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
      if (key === 'status') r = r.filter((x) => (x.status || 'New') === value);
      else r = r.filter((x) => (x[key] || '') === value);
    }
    if (search) r = r.filter((x) => fuzzyMatch(x, search));

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
    setFilters({ level: '', register: '', variety: '', status: '', topic: '', tags: '' });
    setPills({ favourite: false, difficult: false, reviewing: false });
    setTagFilter('');
    setTopicFilter('');
    if (setExtraFilter) setExtraFilter(null);
  };

  const handleTagClick = (value, kind) => {
    if (kind === 'topic') setTopicFilter(value);
    else onOpenTag(value);
  };

  const mobileCats = [
    { id: 'vocabulary', label: 'Vocabulary', icon: BookMarked },
    { id: 'slang', label: 'Slang', icon: MessageCircle },
    { id: 'phrasal', label: 'Phrasal Verbs', icon: Link2 },
    { id: 'expression', label: 'Expressions', icon: Quote },
    { id: 'collocation', label: 'Collocations', icon: Puzzle },
    { id: 'idiom', label: 'Idioms', icon: Lightbulb },
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
          const isActive = (['expression', 'collocation', 'idiom'].includes(c.id) && librarySpecificType && librarySpecificType.toLowerCase() === c.id) || currentView === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={isActive ? 'active' : ''}
              onClick={() => {
                if (['expression', 'collocation', 'idiom'].includes(c.id)) {
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
            <span className={`chip chip-${extraFilter.key === 'level' ? 'level' : extraFilter.key === 'register' ? 'register' : extraFilter.key === 'variety' ? 'variety' : 'status'} inline-flex items-center gap-1`} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              {extraFilter.key.charAt(0).toUpperCase() + extraFilter.key.slice(1)}: {extraFilter.value}
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
      </div>

      <div className={`grid sm:grid-cols-2 xl:grid-cols-3 gap-4 ${currentView === 'tricks' ? 'tricks-layout' : ''}`}>
        {filtered.length === 0 ? (
          <div className="empty-box sm:col-span-2 xl:col-span-3">No entries match this view yet. Add a new discovery to begin.</div>
        ) : filtered.map((r) => (
          <EntryCard key={r.__backendId} record={r} onOpen={onOpenDetail} onToggleFav={onToggleFav} onDelete={onDelete} query={search} onTagClick={handleTagClick} />
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
