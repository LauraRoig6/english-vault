import React, { useMemo } from 'react';
import { Plus, BookMarked, MessageCircle, Link2, Quote, GitBranch, Puzzle, Lightbulb, Brain, Heart } from 'lucide-react';


function Chip({ kind, children }) {
  const cls = { type: 'chip-type', level: 'chip-level', register: 'chip-register', variety: 'chip-variety', topic: 'chip-topic', status: 'chip-status' }[kind] || 'chip-tag';
  return <span className={`chip ${cls}`}>{children}</span>;
}

export default function HomeView({ records, onNavigate, onOpenCategory, onOpenAdd, onOpenDetail }) {
  const stats = useMemo(() => {
    const counts = { Vocabulary: 0, Slang: 0, 'Phrasal Verb': 0, Expression: 0, Collocation: 0, Idiom: 0, 'Connector / Linker': 0, 'Grammar / Trick': 0 };
    records.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++; });
    return {
      counts,
      favourites: records.filter((r) => r.is_favourite).length,
      reviewCount: records.filter((r) => r.needs_review && !r.is_known).length,
    };
  }, [records]);

  const recent = useMemo(() => [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4), [records]);
  const difficult = useMemo(() => records.filter((r) => r.is_difficult).slice(0, 4), [records]);


  const categoryCards = [
    { id: 'vocabulary', label: 'Vocabulary', sub: 'saved discoveries', icon: BookMarked, bg: 'pastel-pink', count: stats.counts.Vocabulary, action: () => onNavigate('vocabulary') },
    { id: 'slang', label: 'Slang', sub: 'expressions', icon: MessageCircle, bg: 'pastel-lavender', count: stats.counts.Slang, action: () => onNavigate('slang') },
    { id: 'phrasal', label: 'Phrasal Verbs', sub: 'saved verbs', icon: Link2, bg: 'pastel-butter', count: stats.counts['Phrasal Verb'], action: () => onNavigate('phrasal') },
    { id: 'expr', label: 'Expressions', sub: 'natural phrases', icon: Quote, bg: 'pastel-sky', count: stats.counts.Expression, action: () => onOpenCategory('Expression') },
    { id: 'connectors', label: 'Connectors / Linkers', sub: 'linking words', icon: GitBranch, bg: 'pastel-sky', count: stats.counts['Connector / Linker'], action: () => onNavigate('connectors') },
    { id: 'coll', label: 'Collocations', sub: 'word pairings', icon: Puzzle, bg: 'pastel-sage', count: stats.counts.Collocation, action: () => onOpenCategory('Collocation') },
    { id: 'idiom', label: 'Idioms', sub: 'colourful language', icon: Lightbulb, bg: 'pastel-blush', count: stats.counts.Idiom, action: () => onOpenCategory('Idiom') },
    { id: 'tricks', label: 'Tricks', sub: 'grammar notes', icon: Brain, bg: 'pastel-lavender', count: stats.counts['Grammar / Trick'], action: () => onNavigate('tricks') },
    { id: 'fav', label: 'Favourites', sub: 'your essentials', icon: Heart, bg: 'pastel-pink', count: stats.favourites, action: () => onNavigate('favourites') },
  ];

  return (
    <section className="view active">
      <section className="hero-panel">
        <div className="hero-inner">
          <p className="eyebrow">Welcome back</p>
          <h1 className="hero-main-title">English <span className="vault-word">Vault</span> ✦</h1>
          <p className="font-semibold mt-5 text-lg">Your gentle place to collect the English you love.</p>
          <p className="hero-description mt-2">
            Save words, expressions, slang, phrasal verbs and grammar tricks. Practise them softly at your own pace, and watch your library grow.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="primary-btn inline-flex gap-2 items-center" type="button" onClick={onOpenAdd}>
              <Plus size={18} /><span>Add a new discovery</span>
            </button>
          </div>
        </div>
      </section>


      {/* Categories */}
      <section className="mt-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="eyebrow">Your library at a glance</p>
            <h2 className="section-heading">Browse by category</h2>
          </div>
          <span className="text-sm font-bold" style={{ color: '#9d4f6e' }}>{records.length} saved discoveries</span>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {categoryCards.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.id} className={`category-card card ${c.bg}`} type="button" onClick={c.action}>
                <span className="mini-icon"><Icon size={18} /></span>
                <p className="font-bold mt-3 m-0">{c.label}</p>
                <div className="count">{c.count}</div>
                <p className="text-sm mt-1 m-0">{c.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom rows */}
      <div className="grid lg:grid-cols-3 gap-5 mt-8">
        <article className="card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-heading">Recently added</h2>
            <button className="text-sm font-bold" style={{ color: '#9d4f6e', background: 'transparent', border: 0 }} type="button" onClick={() => onNavigate('vocabulary')}>View all</button>
          </div>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm py-3" style={{ color: '#726773' }}>Your newest discoveries will appear here.</p>
            ) : recent.map((r) => (
              <button key={r.__backendId} className="w-full text-left p-2 rounded-xl hover:bg-rose-50" onClick={() => onOpenDetail(r)}>
                <strong className="block text-sm">{r.word}</strong>
                <span className="block text-xs" style={{ color: '#726773' }}>{r.type}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-heading">Difficult ones</h2>
            <Chip kind="type">Focus</Chip>
          </div>
          <div className="space-y-2">
            {difficult.length === 0 ? (
              <p className="text-sm py-3" style={{ color: '#726773' }}>No difficult items yet — you’ve got this.</p>
            ) : difficult.map((r) => (
              <button key={r.__backendId} className="w-full text-left p-2 rounded-xl hover:bg-rose-50" onClick={() => onOpenDetail(r)}>
                <strong className="block text-sm">{r.word}</strong>
                <span className="block text-xs" style={{ color: '#726773' }}>{r.type}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="card pastel-lavender p-5">
          <p className="font-bold text-lg m-0">Ready to practise?</p>
          <p className="text-sm mt-2">{stats.reviewCount} discoveries waiting for you</p>
          <button className="primary-btn mt-6 w-full" type="button" onClick={() => onNavigate('practice')}>Start practice →</button>
        </article>
      </div>
    </section>
  );
}
