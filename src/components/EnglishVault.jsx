import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVault } from '../hooks/useVault';
import Sidebar from './Sidebar';
import HomeView from './HomeView';
import LibraryView from './LibraryView';
import PracticeView from './PracticeView';
import EntryModal from './EntryModal';
import DetailModal from './DetailModal';
import SurpriseDiscoveryModal from './SurpriseDiscoveryModal';
import { Search, Dice5, Plus, House, LibraryBig, GraduationCap, Heart, LogOut, RefreshCw } from 'lucide-react';
import { normalizeEntryText, isDue } from '../lib/vaultUtils';

export default function EnglishVault({ session, onSignOut }) {
  const { records, create, update, remove, loaded, syncError, reload } = useVault(session);
  const [currentView, setCurrentView] = useState('home');
  const [librarySpecificType, setLibrarySpecificType] = useState('');
  const [libraryTagFilter, setLibraryTagFilter] = useState('');
  const [libraryTopicFilter, setLibraryTopicFilter] = useState('');
  const [libraryExtraFilter, setLibraryExtraFilter] = useState(null); // { key, value }
  const [search, setSearch] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [prefillRecord, setPrefillRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [surpriseSuggestion, setSurpriseSuggestion] = useState(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [surpriseError, setSurpriseError] = useState('');
  const [toast, setToast] = useState(null);
  const [practiceBatch, setPracticeBatch] = useState([]);
  const [practiceToken, setPracticeToken] = useState(0);
  const toastTimer = useRef(null);
  const undoBufferRef = useRef(null);

  const showToast = useCallback((message, action = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, action });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  };

  const openView = (v) => {
    setCurrentView(v);
    setLibrarySpecificType('');
    setLibraryTagFilter('');
    setLibraryTopicFilter('');
    setLibraryExtraFilter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCategory = (type) => {
    setCurrentView('expressions');
    setLibrarySpecificType(type);
    setLibraryTagFilter('');
    setLibraryTopicFilter('');
    setLibraryExtraFilter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLibraryWithTag = (tag) => {
    setCurrentView('vocabulary');
    setLibrarySpecificType('');
    setLibraryTagFilter(tag);
    setLibraryTopicFilter('');
    setLibraryExtraFilter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLibraryWithTopic = (topic) => {
    setCurrentView('vocabulary');
    setLibrarySpecificType('');
    setLibraryTagFilter('');
    setLibraryTopicFilter(topic);
    setLibraryExtraFilter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Any chip clicked (level/register/variety/status/type) → filter across all
  const openLibraryWithFilter = (value, kind) => {
    if (kind === 'tag') return openLibraryWithTag(value);
    if (kind === 'topic') return openLibraryWithTopic(value);
    if (kind === 'type') {
      // Navigate to that type's library section
      const map = { 'Vocabulary': 'vocabulary', 'Slang': 'slang', 'Phrasal Verb': 'phrasal', 'Connector / Linker': 'connectors', 'Grammar / Trick': 'tricks' };
      if (map[value]) return openView(map[value]);
      if (['Expression', 'Collocation', 'Idiom'].includes(value)) return openCategory(value);
      return;
    }
    // level, register, variety, status
    setCurrentView('vocabulary');
    setLibrarySpecificType('');
    setLibraryTagFilter('');
    setLibraryTopicFilter('');
    setLibraryExtraFilter({ key: kind, value });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdd = () => {
    setEditingRecord(null);
    setPrefillRecord(null);
    setEntryModalOpen(true);
  };


  const openEdit = (record) => {
    setEditingRecord(record);
    setPrefillRecord(null);
    setDetailRecord(null);
    setEntryModalOpen(true);
  };

  const handleRelatedClick = (item) => {
    const target = normalizeEntryText(item);
    const found = records.find((r) => normalizeEntryText(r.word) === target);
    if (found) {
      setDetailRecord(found);
      return;
    }
    setDetailRecord(null);
    setEditingRecord(null);
    setPrefillRecord({ word: item, type: 'Vocabulary' });
    setEntryModalOpen(true);
    showToast(`“${item}” is not in your Vault yet — add it if you want.`);
  };

  const startPracticeBatch = (batch) => {
    const clean = (batch || []).filter(Boolean);
    if (!clean.length) { showToast('Nothing is due right now.'); return; }
    setPracticeBatch(clean);
    setPracticeToken((n) => n + 1);
    setDetailRecord(null);
    setCurrentView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizOne = (record) => startPracticeBatch([record]);
  const handleStartDue = () => startPracticeBatch(records.filter((r) => isDue(r)));

  const typeToView = (type) => {
    if (!type) return null;
    const map = {
      'Vocabulary': 'vocabulary',
      'Slang': 'slang',
      'Phrasal Verb': 'phrasal',
      'Connector / Linker': 'connectors',
      'Grammar / Trick': 'tricks',
    };
    if (map[type]) return { view: map[type], category: null };
    if (['Expression', 'Collocation', 'Idiom'].includes(type)) return { view: 'expressions', category: type };
    return null;
  };

  const handleSave = (data) => {
    setSearch(''); // Clear search so new entry is visible in library
    if (editingRecord) {
      update({ ...editingRecord, ...data });
      showToast('Changes saved.');
    } else {
      create(data);
      const target = typeToView(data.type);
      showToast(
        `Saved to ${data.type}.`,
        target ? {
          label: 'View',
          run: () => {
            if (target.category) openCategory(target.category);
            else openView(target.view);
          },
        } : null
      );
    }
  };

  const handleToggleFav = (record) => {
    update({ ...record, is_favourite: !record.is_favourite });
  };

  const handleDelete = (record) => {
    undoBufferRef.current = record;
    remove(record);
    setDetailRecord(null);
    showToast(`"${record.word}" deleted.`, {
      label: 'Undo',
      run: () => {
        if (undoBufferRef.current) {
          const r = undoBufferRef.current;
          create({ ...r, __restore: true, __backendId: undefined });
          undoBufferRef.current = null;
          showToast('Restored.');
        }
      },
    });
  };

  // Top-bar Surprise me: revisit something that is already saved in the vault.
  const handleSurprise = () => {
    if (!records.length) {
      showToast('Your vault is empty — add a discovery first.');
      return;
    }
    const random = records[Math.floor(Math.random() * records.length)];
    setDetailRecord(random);
    showToast(`From your vault: “${random.word}”`);
  };

  // Home hero Surprise me: ask AI for something genuinely new, without saving it.
  const handleDiscoverSurprise = async () => {
    setSurpriseModalOpen(true);
    setSurpriseSuggestion(null);
    setSurpriseError('');
    setSurpriseLoading(true);
    try {
      const response = await fetch('/api/surprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclude: records.map((r) => r.word).filter(Boolean) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not generate a surprise.');
      setSurpriseSuggestion(data);
    } catch (err) {
      setSurpriseError(err?.message || 'Could not generate a surprise.');
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleSurpriseSeeMore = async (suggestion) => {
    const response = await fetch('/api/autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: suggestion.word, type: suggestion.type }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Could not generate the full entry.');
    setSurpriseModalOpen(false);
    setEditingRecord(null);
    setPrefillRecord(data);
    setEntryModalOpen(true);
  };

  const handleExport = () => {
    const data = records.map(({ __backendId, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'english-vault-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Vault exported.');
  };

  const handleImport = async (file) => {
    try {
      const text = await file.text();
      const rows = JSON.parse(text);
      if (!Array.isArray(rows)) throw new Error();
      let added = 0;
      const existing = new Set(records.map((r) => normalizeEntryText(r.word)));
      rows.forEach((row) => {
        if (!row.word || !row.type) return;
        if (existing.has(normalizeEntryText(row.word))) return;
        create(row);
        added++;
      });
      showToast(`${added} imported entries added.`);
    } catch (e) {
      showToast('Choose a valid English Vault JSON export.');
    }
  };

  useEffect(() => {
    // Cleanup toast timer on unmount
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar currentView={currentView} onNavigate={openView} />

      <main className="page-main">
        <header className="topbar">
          <div className="search-wrap">
            <Search />
            <label className="sr-only" htmlFor="global-search">Search</label>
            <input
              id="global-search"
              type="search"
              placeholder="Search your vault…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Auto-jump to library on first keystroke so results are visible
                if (e.target.value && !['vocabulary', 'slang', 'phrasal', 'expressions', 'connectors', 'tricks', 'favourites'].includes(currentView)) {
                  setCurrentView('vocabulary');
                  setLibrarySpecificType('');
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <button className="soft-btn inline-flex gap-2 items-center" type="button" onClick={reload} title="Sync now">
              <RefreshCw size={18} />
            </button>
            <button className="soft-btn inline-flex gap-2 items-center" type="button" onClick={onSignOut} title="Sign out">
              <LogOut size={18} />
            </button>
            <button className="soft-btn inline-flex gap-2 items-center" type="button" onClick={handleSurprise}>
              <Dice5 size={18} />Surprise me
            </button>
            <button className="primary-btn inline-flex gap-2 items-center" type="button" onClick={openAdd}>
              <Plus size={18} /><span>Add</span>
            </button>
          </div>
        </header>

        {!loaded && (
          <div style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 14, background: '#fff6fa', color: '#7c5367', fontWeight: 700 }}>
            Syncing your vault…
          </div>
        )}
        {syncError && (
          <div style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 14, background: '#fff0f2', color: '#9c2944' }}>
            Sync issue: {syncError} <button type="button" onClick={reload} style={{ border: 0, background: 'transparent', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>Try again</button>
          </div>
        )}

        {currentView === 'home' && (
          <HomeView
            records={records}
            onNavigate={openView}
            onOpenCategory={openCategory}
            onOpenAdd={openAdd}
            onOpenDetail={setDetailRecord}
            onDiscoverSurprise={handleDiscoverSurprise}
            surpriseLoading={surpriseLoading}
            onStartDue={handleStartDue}
          />
        )}

        {['vocabulary', 'slang', 'phrasal', 'expressions', 'connectors', 'tricks', 'favourites'].includes(currentView) && (
          <LibraryView
            records={records}
            currentView={currentView}
            librarySpecificType={librarySpecificType}
            setLibrarySpecificType={setLibrarySpecificType}
            tagFilter={libraryTagFilter}
            setTagFilter={setLibraryTagFilter}
            topicFilter={libraryTopicFilter}
            setTopicFilter={setLibraryTopicFilter}
            extraFilter={libraryExtraFilter}
            setExtraFilter={setLibraryExtraFilter}
            search={search}
            onOpenDetail={setDetailRecord}
            onToggleFav={handleToggleFav}
            onDelete={handleDelete}
            onNavigate={openView}
            onOpenCategory={openCategory}
            onExport={handleExport}
            onImport={handleImport}
            onOpenTag={openLibraryWithTag}
          />
        )}

        {currentView === 'practice' && (
          <PracticeView records={records} onUpdate={update} onToast={showToast} focusRecords={practiceBatch} focusToken={practiceToken} />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <button className={currentView === 'home' ? 'active' : ''} onClick={() => openView('home')}>
          <House size={20} /><span>Home</span>
        </button>
        <button className={currentView === 'vocabulary' ? 'active' : ''} onClick={() => openView('vocabulary')}>
          <LibraryBig size={20} /><span>Library</span>
        </button>
        <button className={currentView === 'practice' ? 'active' : ''} onClick={() => openView('practice')}>
          <GraduationCap size={20} /><span>Practice</span>
        </button>
        <button className={currentView === 'favourites' ? 'active' : ''} onClick={() => openView('favourites')}>
          <Heart size={20} /><span>Saved</span>
        </button>
      </nav>

      {surpriseModalOpen && (
        <SurpriseDiscoveryModal
          suggestion={surpriseSuggestion}
          loading={surpriseLoading}
          error={surpriseError}
          onClose={() => { setSurpriseModalOpen(false); setSurpriseSuggestion(null); setSurpriseError(''); }}
          onAnother={handleDiscoverSurprise}
          onSeeMore={handleSurpriseSeeMore}
        />
      )}

      {entryModalOpen && (
        <EntryModal
          onClose={() => { setEntryModalOpen(false); setEditingRecord(null); setPrefillRecord(null); }}
          onSave={handleSave}
          editingRecord={editingRecord}
          prefillRecord={prefillRecord}
          existingRecords={records}
        />
      )}

      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleFav={handleToggleFav}
          onUpdate={update}
          onTagClick={(value, kind) => { setDetailRecord(null); openLibraryWithFilter(value, kind); }}
          onRelatedClick={handleRelatedClick}
          onQuiz={handleQuizOne}
        />
      )}

      <div id="toast" className={toast ? 'show' : ''} role="status">
        <span>{toast?.message}</span>
        {toast?.action && (
          <button
            type="button"
            onClick={() => { toast.action.run(); dismissToast(); }}
            style={{ marginLeft: '12px', background: 'rgba(255,255,255,0.22)', border: 0, color: '#fff', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', cursor: 'pointer' }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
