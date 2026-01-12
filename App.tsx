
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { EntryForm } from './components/EntryForm';
import { EntryList } from './components/EntryList';
import { BillingModal } from './components/BillingModal';
import { OwnerDetailsModal } from './components/OwnerDetailsModal';
import { ContactModal } from './components/ContactModal';
import { AboutModal } from './components/AboutModal';
import { HelpModal } from './components/HelpModal';
import { Notebook } from './components/Notebook';
import { UserManagementModal } from './components/UserManagementModal';
import { Theme, InventoryEntry, User, AppSettings } from './types';
import { storageService } from './services/storageService';
import { 
  Plus, List, Trash2, 
  ArrowLeft, BookOpen, LayoutGrid, IndianRupee 
} from 'lucide-react';

const App: React.FC = () => {
  // --- States ---
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('theme') as Theme) || 'light'
  );
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    // Defaulting to PRO JEWELLERY if no settings exist, or overriding specifically if it was the old default
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.primaryTitle === 'PRECISION') {
        parsed.primaryTitle = 'PRO JEWELLERY';
      }
      return parsed;
    }
    return { primaryTitle: 'PRO JEWELLERY', secondaryTitle: 'Gram Tracker Pro' };
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('app_users');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Master User' }];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => 
    localStorage.getItem('current_user_id') || (users[0]?.id || 'default')
  );

  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [view, setView] = useState<'form' | 'list' | 'trash'>('form');
  const [showBilling, setShowBilling] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  
  // Rate state
  const [billingRate, setBillingRate] = useState(0);

  // --- Effects ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('app_users', JSON.stringify(users));
    localStorage.setItem('current_user_id', currentUserId);
  }, [settings, users, currentUserId]);

  useEffect(() => {
    const saved = storageService.getEntries();
    setEntries(saved);
  }, []);

  useEffect(() => {
    setBillingRate(storageService.getBillingRate(currentUserId));
  }, [currentUserId]);

  // --- Logical Computations ---
  const activeUser = useMemo(() => users.find(u => u.id === currentUserId) || users[0], [users, currentUserId]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => e.userId === currentUserId && !e.isDeleted)
      .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true }));
  }, [entries, currentUserId]);

  const trashedEntries = useMemo(() => {
    return entries.filter(e => e.userId === currentUserId && e.isDeleted);
  }, [entries, currentUserId]);

  const totalWeight = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => acc + curr.weight, 0);
  }, [filteredEntries]);

  // --- Handlers ---
  const handleAddEntry = (newEntry: Omit<InventoryEntry, 'id' | 'createdAt' | 'isDeleted'>) => {
    const entry: InventoryEntry = {
      ...newEntry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isDeleted: false
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    storageService.saveEntries(updated);
    setView('list');
  };

  const handleUpdateEntry = (updatedEntry: InventoryEntry) => {
    const updated = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setEntries(updated);
    storageService.saveEntries(updated);
  };

  const handleAction = (id: string, action: 'delete' | 'restore' | 'permanent') => {
    let updated;
    if (action === 'delete') updated = entries.map(e => e.id === id ? { ...e, isDeleted: true } : e);
    else if (action === 'restore') updated = entries.map(e => e.id === id ? { ...e, isDeleted: false } : e);
    else updated = entries.filter(e => e.id !== id);
    
    setEntries(updated);
    storageService.saveEntries(updated);
  };

  const handleSaveRate = (rate: number) => {
    storageService.saveBillingRate(currentUserId, rate);
    setBillingRate(rate);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 pb-32`}>
      
      <Header 
        theme={theme} setTheme={setTheme} 
        settings={settings} setSettings={setSettings}
        users={users} currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        onAddUser={(name) => {
          const newUser = { id: crypto.randomUUID(), name };
          setUsers([...users, newUser]);
          setCurrentUserId(newUser.id);
        }}
        onUpdateUser={(u) => setUsers(users.map(user => user.id === u.id ? u : user))}
        onViewTrash={() => setView('trash')}
        trashCount={trashedEntries.length}
        onSetView={setView}
        onShowOwnerDetails={() => setShowOwnerDetails(true)}
        onShowContact={() => setShowContact(true)}
        onShowAbout={() => setShowAbout(true)}
        onShowHelp={() => setShowHelp(true)}
        onManageUsers={() => setShowUserManager(true)}
      />

      <div className="max-w-5xl mx-auto px-6 pt-28">
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-10 rounded-[3rem] shadow-2xl shadow-orange-200 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform -rotate-12 translate-x-12 -translate-y-12">
             <LayoutGrid size={240} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div>
              <p className="text-orange-100 font-black text-[10px] uppercase tracking-[0.4em] mb-4 opacity-80">Inventory Live Balance</p>
              <h1 className="text-7xl font-black text-white tracking-tighter flex items-end gap-3">
                {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <span className="text-xl mb-3 font-bold opacity-60 uppercase tracking-widest">Grams</span>
              </h1>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowNotebook(true)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-2xl flex items-center gap-4 text-white hover:bg-white/20 transition-all active:scale-95"
              >
                <BookOpen className="w-5 h-5 text-orange-200" />
                <span className="font-black text-xs uppercase tracking-widest">Digital Ledger</span>
              </button>
              <button 
                onClick={() => setShowBilling(true)}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-4 text-white hover:bg-slate-900/60 transition-all active:scale-95"
              >
                <IndianRupee className="w-5 h-5 text-orange-400" />
                <span className="font-black text-xs uppercase tracking-widest">Billing Insight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
             <div className={`p-4 rounded-2xl ${view === 'trash' ? 'bg-red-600' : 'bg-orange-600'} text-white shadow-lg`}>
                {view === 'form' ? <Plus size={24} /> : view === 'list' ? <List size={24} /> : <Trash2 size={24} />}
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {view === 'form' ? 'Jewelry' : view === 'list' ? 'Records Vault' : 'Recycle Bin'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {view === 'form' ? 'Add new materials' : view === 'list' ? 'Manage historical data' : 'Restoration & cleanup'}
                </p>
             </div>
          </div>
          {view !== 'form' && (
             <button onClick={() => setView('form')} className="bg-orange-50 dark:bg-white/5 p-3 rounded-2xl text-orange-600 transition-all hover:bg-orange-100">
               <ArrowLeft size={20} />
             </button>
          )}
        </div>

        <div className="transition-all duration-300">
          {view === 'form' ? (
            <EntryForm onSubmit={handleAddEntry} currentUserId={currentUserId} users={users} />
          ) : (
            <EntryList 
              entries={view === 'list' ? filteredEntries : trashedEntries} 
              isTrashView={view === 'trash'}
              onDelete={(id) => handleAction(id, view === 'trash' ? 'permanent' : 'delete')} 
              onRestore={(id) => handleAction(id, 'restore')}
              onUpdate={handleUpdateEntry}
              currentUser={activeUser}
            />
          )}
        </div>
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/5 z-[60]">
        <button
          onClick={() => setView('form')}
          className={`flex items-center gap-3 px-10 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
            view === 'form' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus size={18} /> Entry
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-3 px-10 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
            view === 'list' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <List size={18} /> Vault
        </button>
      </nav>

      {showBilling && activeUser && (
        <BillingModal 
          user={activeUser} 
          entries={filteredEntries} 
          totalWeight={totalWeight} 
          billingRate={billingRate}
          onClose={() => setShowBilling(false)} 
        />
      )}
      {showUserManager && (
        <UserManagementModal 
          users={users} 
          setUsers={setUsers} 
          currentUserId={currentUserId} 
          setCurrentUserId={setCurrentUserId} 
          onClose={() => setShowUserManager(false)} 
        />
      )}
      {showNotebook && (
        <Notebook 
          onClose={() => setShowNotebook(false)} 
          totalWeight={totalWeight}
          currentRate={billingRate}
          onSaveRate={handleSaveRate}
        />
      )}
      {showOwnerDetails && <OwnerDetailsModal onClose={() => setShowOwnerDetails(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

    </div>
  );
};

export default App;
