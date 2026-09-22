import React from 'react';
import { House, LibraryBig, MessageCircle, Link2, Sparkles, GitBranch, Brain, GraduationCap, Heart, Zap } from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'vocabulary', label: 'Vocabulary', icon: LibraryBig },
  { id: 'verbs', label: 'Verbs', icon: Zap },
  { id: 'slang', label: 'Slang', icon: MessageCircle },
  { id: 'phrasal', label: 'Phrasal Verbs', icon: Link2 },
  { id: 'expressions', label: 'Expressions & Collocations', icon: Sparkles },
  { id: 'idioms', label: 'Idioms', icon: Sparkles },
  { id: 'connectors', label: 'Connectors / Linkers', icon: GitBranch },
  { id: 'tricks', label: 'Tricks', icon: Brain },
  { id: 'practice', label: 'Practice', icon: GraduationCap },
  { id: 'favourites', label: 'Favourites', icon: Heart },
];

export default function Sidebar({ currentView, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="flex items-center gap-3 px-2 mb-9">
        <div className="brand-mark brand-logo">EV<span>✦</span></div>
        <div>
          <h1 className="font-bold text-lg leading-none m-0">English Vault</h1>
          <p className="text-xs mt-1 m-0" style={{ color: '#857480' }}>Your learning library</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <p style={{ margin: '18px 10px 0', fontSize: '0.68rem', color: '#b095a2', fontWeight: 700 }}>v10.2 · rich text + ladder</p>
    </aside>
  );
}
