import React, { useMemo } from 'react';
import { FolderHeart, ArrowRight } from 'lucide-react';

const covers = [
  'linear-gradient(135deg,#fbe4ec,#fff3c9)',
  'linear-gradient(135deg,#e9e3fa,#eaf4fa)',
  'linear-gradient(135deg,#e4efe4,#fff8f4)',
  'linear-gradient(135deg,#fff3c9,#fbe4ec)',
  'linear-gradient(135deg,#eaf4fa,#e9e3fa)',
  'linear-gradient(135deg,#fde5ed,#e4efe4)',
];

export default function CollectionsView({ records, onOpenTopic }) {
  const groups = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const t = (r.topic || '').trim();
      if (!t) return;
      if (!map.has(t)) map.set(t, []);
      map.get(t).push(r);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [records]);

  const untagged = records.filter((r) => !(r.topic || '').trim()).length;

  return (
    <section className="view active">
      <div className="mb-7">
        <p className="eyebrow">Grouped by topic</p>
        <h2 className="page-title">Collections</h2>
        <p className="mt-3" style={{ color: '#726773' }}>Every topic you’ve tagged, in one place. Tap a cover to explore its entries.</p>
      </div>

      {groups.length === 0 ? (
        <div className="empty-box">Add topics to your entries and beautiful collections will appear here.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(([topic, items], i) => (
            <button key={topic} type="button" onClick={() => onOpenTopic(topic)}
              className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 19px 38px rgba(120,67,89,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ height: '110px', background: covers[i % covers.length], display: 'flex', alignItems: 'flex-end', padding: '16px', position: 'relative' }}>
                <div className="mini-icon" style={{ background: 'rgba(255,255,255,0.85)' }}><FolderHeart size={18} /></div>
                <span style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.75)', borderRadius: '999px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#9d4f6e' }}>{items.length}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <h3 className="font-bold m-0" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem' }}>{topic}</h3>
                <p className="text-xs mt-2 m-0" style={{ color: '#726773' }}>
                  {items.slice(0, 3).map((r) => r.word).join(' · ')}{items.length > 3 ? '…' : ''}
                </p>
                <p className="text-sm mt-3 m-0 inline-flex items-center gap-1 font-bold" style={{ color: '#9d4f6e' }}>Open <ArrowRight size={14} /></p>
              </div>
            </button>
          ))}
        </div>
      )}

      {untagged > 0 && (
        <p className="text-sm mt-6" style={{ color: '#726773' }}>{untagged} entries don’t have a topic yet.</p>
      )}
    </section>
  );
}
