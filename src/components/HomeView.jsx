import React, { useMemo } from 'react';
import { Plus, Sparkles, BookMarked, MessageCircle, Link2, Quote, GitBranch, Puzzle, Lightbulb, Brain, Heart, Clock3, Zap, Layers3 } from 'lucide-react';
import { isDue } from '../lib/vaultUtils';


function Chip({ kind, children }) {
  const cls = { type: 'chip-type', level: 'chip-level', register: 'chip-register', variety: 'chip-variety', topic: 'chip-topic', status: 'chip-status' }[kind] || 'chip-tag';
  return <span className={`chip ${cls}`}>{children}</span>;
}

export default function HomeView({ records, onNavigate, onOpenCategory, onOpenAdd, onOpenDetail, onDiscoverSurprise, surpriseLoading, onStartDue, onNeedsAttention, onSmartCollection, onOpenSavedView }) {
  const stats = useMemo(() => {
    const counts = { Vocabulary: 0, Verb: 0, Slang: 0, 'Phrasal Verb': 0, Expression: 0, Collocation: 0, Idiom: 0, 'Connector / Linker': 0, 'Grammar / Trick': 0 };
    records.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++; });
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      counts,
      favourites: records.filter((r) => r.is_favourite).length,
      reviewCount: records.filter((r) => isDue(r)).length,
      learning: records.filter((r) => (r.status || 'New') === 'Learning').length,
      almost: records.filter((r) => r.status === 'Almost learnt').length,
      mastered: records.filter((r) => r.status === 'Mastered' || r.is_known).length,
      addedWeek: records.filter((r) => new Date(r.created_at || 0).getTime() >= weekAgo).length,
      needsAttention: records.filter((r) => {
        if (r.type === 'Grammar / Trick') return !(r.rule || r.transitive) || !(r.explanation || r.how_common) || !(r.common_mistakes || r.notes);
        return !r.meaning || !r.spanish || !r.example || !r.common_mistakes || !r.pronunciation_easy;
      }).length,
    };
  }, [records]);

  const recent = useMemo(() => [...records].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4), [records]);
  const difficult = useMemo(() => records.filter((r) => r.is_difficult).slice(0, 4), [records]);
  const mostMissed = useMemo(() => [...records].filter(r=>(r.mistake_count||0)>0).sort((a,b)=>(b.mistake_count||0)-(a.mistake_count||0)).slice(0,4), [records]);
  const timeline = useMemo(() => [...records].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,8), [records]);
  const savedViews = useMemo(() => { try { return JSON.parse(localStorage.getItem('ev-saved-searches') || '[]'); } catch { return []; } }, []);
  const streak = useMemo(() => {
    const days = new Set(records.map(r=>String(r.created_at||'').slice(0,10)).filter(Boolean));
    let count=0; const d=new Date();
    for(let i=0;i<365;i++){ const key=d.toISOString().slice(0,10); if(days.has(key)) count++; else if(i>0) break; d.setDate(d.getDate()-1); }
    return count;
  },[records]);


  const categoryCards = [
    { id: 'vocabulary', label: 'Vocabulary', sub: 'saved discoveries', icon: BookMarked, bg: 'pastel-pink', count: stats.counts.Vocabulary, action: () => onNavigate('vocabulary') },
    { id: 'verbs', label: 'Verbs', sub: 'lexical verbs', icon: Zap, bg: 'pastel-sage', count: stats.counts.Verb, action: () => onNavigate('verbs') },
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
            <button className="soft-btn inline-flex gap-2 items-center" type="button" onClick={onDiscoverSurprise} disabled={surpriseLoading}>
              <Sparkles size={18} /><span>{surpriseLoading ? 'Finding a surprise…' : 'Surprise me · discover something new'}</span>
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

      <section className="mt-8">
        <div className="flex justify-between items-end mb-4">
          <div><p className="eyebrow">Auto-organised for you</p><h2 className="section-heading">Smart collections</h2></div>
          <Layers3 size={20} style={{ color: '#9d4f6e' }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['formal-writing','Formal writing','Essay-friendly & formal'],
            ['confusable','Words I confuse','Confused with + my mistakes'],
            ['hard','Hard words','Your difficult entries'],
            ['forgotten','Forgotten words','Not reviewed for a while'],
          ].map(([id,label,sub]) => (
            <button key={id} type="button" className="card p-4 text-left smart-collection-card" onClick={() => onSmartCollection?.(id)}>
              <strong className="block">{label}</strong><span className="text-xs mt-1 block" style={{ color:'#766a72' }}>{sub}</span>
            </button>
          ))}
        </div>
        <div className="card p-4 mt-3" style={{ background:'#fffaf0' }}>
          <strong>Weekly recap ✦</strong>
          <span className="text-sm ml-2" style={{ color:'#726773' }}>You added {stats.addedWeek} {stats.addedWeek === 1 ? 'entry' : 'entries'} this week, have {stats.mastered} mastered, and a {streak}-day adding streak.</span>
        </div>
      </section>

      {savedViews.length > 0 && <section className="mt-8"><div className="flex justify-between items-end mb-4"><div><p className="eyebrow">Made by you</p><h2 className="section-heading">Pinned collections</h2></div></div><div className="flex flex-wrap gap-2">{savedViews.map(v=><button key={v.name} className="soft-btn" type="button" onClick={()=>onOpenSavedView?.(v)}>📌 {v.name}</button>)}</div></section>}

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

        <article className="card p-5">
          <div className="flex justify-between items-center mb-4"><h2 className="section-heading">Most missed</h2><Chip kind="register">Mistake history</Chip></div>
          <div className="space-y-2">{mostMissed.length===0?<p className="text-sm py-3" style={{color:'#726773'}}>No repeated mistakes logged yet.</p>:mostMissed.map(r=><button key={r.__backendId} className="w-full text-left p-2 rounded-xl hover:bg-rose-50" onClick={()=>onOpenDetail(r)}><strong className="block text-sm">{r.word}</strong><span className="block text-xs" style={{color:'#726773'}}>{r.mistake_count} misses · {r.review_count||0} reviews</span></button>)}</div>
        </article>

        <article className="card pastel-lavender p-5">
          <p className="font-bold text-lg m-0"><Clock3 size={18} style={{ display: 'inline', marginRight: 6 }} />Review due</p>
          <p className="text-sm mt-2">{stats.reviewCount} {stats.reviewCount === 1 ? 'discovery is' : 'discoveries are'} ready for review</p>
          <button className="primary-btn mt-6 w-full" type="button" onClick={onStartDue || (() => onNavigate('practice'))} disabled={!stats.reviewCount}>
            {stats.reviewCount ? 'Review due now →' : 'Nothing due today ✦'}
          </button>
        </article>
      </div>

      <section className="mt-8">
        <p className="eyebrow">Your learning timeline</p><h2 className="section-heading">Recent activity</h2>
        <div className="timeline-strip mt-4">{timeline.map(r=><button key={r.__backendId} type="button" onClick={()=>onOpenDetail(r)}><span>{new Date(r.created_at||0).toLocaleDateString(undefined,{day:'2-digit',month:'short'})}</span><strong>{r.word}</strong><small>{r.type}</small></button>)}</div>
      </section>

      <section className="mt-8">
        <p className="eyebrow">Your progress</p>
        <h2 className="section-heading">Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-4">
          {[
            ['Total', records.length], ['Learning', stats.learning], ['Almost learnt', stats.almost], ['Mastered', stats.mastered], ['Added this week', stats.addedWeek], ['Needs attention', stats.needsAttention],
          ].map(([label, value]) => {
            const clickable = label === 'Needs attention';
            const Tag = clickable ? 'button' : 'article';
            return (
              <Tag key={label} type={clickable ? 'button' : undefined} className={`card p-4 stat-card ${clickable ? 'stat-card-clickable' : ''}`} onClick={clickable ? onNeedsAttention : undefined}>
                <p className="text-xs font-bold tracking-widest m-0" style={{ color: '#9a7180' }}>{label}</p>
                <p className="m-0 mt-2" style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700 }}>{value}</p>
                {clickable && <span className="text-xs font-bold mt-2 block" style={{ color: '#9d4f6e' }}>See incomplete entries →</span>}
              </Tag>
            );
          })}
        </div>
      </section>
    </section>
  );
}
