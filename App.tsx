import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { EntryForm } from './components/EntryForm';
import { EntryList } from './components/EntryList';
import { BillingModal } from './components/BillingModal';
import { OwnerDetailsModal } from './components/OwnerDetailsModal';
import { ContactModal } from './components/ContactModal';
import { AboutModal } from './components/AboutModal';
import { HelpModal } from './components/HelpModal';
import { EmergencyModal } from './components/EmergencyModal';
import { Notebook } from './components/Notebook';
import { UserManagementModal } from './components/UserManagementModal';
import { DaiNumberModal } from './components/DaiNumberModal';
import { DaiEntryModal } from './components/DaiEntryModal';
import { Theme, InventoryEntry, User, AppSettings, DaiEntry, DaiEntryStatus } from './types';
import { storageService } from './services/storageService';
import { 
  Plus, List, Trash2, 
  ArrowLeft, BookOpen, LayoutGrid, IndianRupee,
  MoreVertical, Hash, Download, Upload
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
  const [daiEntries, setDaiEntries] = useState<DaiEntry[]>([]); // New state for Tasks
  
  const [view, setView] = useState<'form' | 'list' | 'trash'>('form');
  const [showBilling, setShowBilling] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showDaiNumber, setShowDaiNumber] = useState(false);
  const [showDaiEntry, setShowDaiEntry] = useState(false);
  
  // Rate state
  const [billingRate, setBillingRate] = useState(0);

  // Vault Menu State
  const [isVaultMenuOpen, setIsVaultMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

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
    setEntries(storageService.getEntries());
    setDaiEntries(storageService.getDaiEntries());
  }, []);

  useEffect(() => {
    setBillingRate(storageService.getBillingRate(currentUserId));
  }, [currentUserId]);

  // --- Logical Computations ---
  const activeUsers = useMemo(() => users.filter(u => !u.isDeleted), [users]);
  const activeUser = useMemo(() => activeUsers.find(u => u.id === currentUserId) || activeUsers[0] || users[0], [activeUsers, currentUserId, users]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => e.userId === currentUserId && !e.isDeleted)
      .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true }));
  }, [entries, currentUserId]);

  const trashedEntries = useMemo(() => {
    return entries.filter(e => e.userId === currentUserId && e.isDeleted);
  }, [entries, currentUserId]);

  const trashedUsers = useMemo(() => {
    return users.filter(u => u.isDeleted);
  }, [users]);

  const trashedDaiEntries = useMemo(() => {
    return daiEntries.filter(e => e.status === 'trash');
  }, [daiEntries]);

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
    if (action === 'restore') {
       const updated = entries.map(e => e.id === id ? { ...e, isDeleted: false } : e);
       setEntries(updated);
       storageService.saveEntries(updated);
       return;
    }

    if (action === 'delete') {
        // Soft Delete (Move to Recycle Bin) - Instant Action, No Confirmation
        const updated = entries.map(e => e.id === id ? { ...e, isDeleted: true } : e);
        setEntries(updated);
        storageService.saveEntries(updated);
    } else {
        // Permanent Delete - Removed confirmation for individual item speed
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        storageService.saveEntries(updated);
        
        // If we were in trash view and it's empty now, go back to list
        if (view === 'trash' && trashedEntries.length <= 1 && trashedUsers.length === 0 && trashedDaiEntries.length === 0) {
            setView('list');
        }
    }
  };

  const handleUserAction = (id: string, action: 'restore' | 'permanent') => {
    if (action === 'restore') {
      setUsers(users.map(u => u.id === id ? { ...u, isDeleted: false } : u));
    } else {
      // Permanent Delete - Removed confirmation
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleDaiAction = (id: string, action: 'restore' | 'permanent') => {
    if (action === 'restore') {
        const updated = daiEntries.map(e => e.id === id ? { ...e, status: 'waiting' as DaiEntryStatus } : e);
        setDaiEntries(updated);
        storageService.saveDaiEntries(updated);
    } else {
        // Permanent Delete - Removed confirmation for individual item speed
        const updated = daiEntries.filter(e => e.id !== id);
        setDaiEntries(updated);
        storageService.saveDaiEntries(updated);
    }
  };

  const handleEmptyTrash = () => {
     const hasTrash = trashedEntries.length > 0 || trashedUsers.length > 0 || trashedDaiEntries.length > 0;
     if (!hasTrash) return;

     if (window.confirm("WARNING: You are about to empty the Recycle Bin.\n\nAll items in the bin (Inventory, Users, Tasks) will be permanently deleted.\nThis action cannot be undone.\n\nProceed?")) {
        
        // 1. Inventory
        const newEntries = entries.filter(e => !(e.userId === currentUserId && e.isDeleted));
        setEntries(newEntries);
        storageService.saveEntries(newEntries);

        // 2. Users
        const newUsers = users.filter(u => !u.isDeleted);
        setUsers(newUsers);

        // 3. Dai Entries
        const newDaiEntries = daiEntries.filter(e => e.status !== 'trash');
        setDaiEntries(newDaiEntries);
        storageService.saveDaiEntries(newDaiEntries);

        setView('list');
     }
  };

  const handleSaveRate = (rate: number) => {
    storageService.saveBillingRate(currentUserId, rate);
    setBillingRate(rate);
  };

  const handleExportData = () => {
    // Gather all data from the application
    const fullData = {
      metadata: {
        version: '2.0',
        timestamp: Date.now(),
        type: 'PRO_JEWELLERY_FULL_BACKUP'
      },
      data: {
        entries: storageService.getEntries(),
        notes: storageService.getNotes(),
        daiImages: storageService.getDaiImages(),
        daiEntries: storageService.getDaiEntries(),
        emergencyContacts: storageService.getEmergencyContacts(),
        users: JSON.parse(localStorage.getItem('app_users') || '[]'),
        settings: JSON.parse(localStorage.getItem('app_settings') || '{}'),
        billingRates: JSON.parse(localStorage.getItem('precision_billing_rates') || '{}'),
        aboutPhoto: localStorage.getItem('app_about_photo'),
        helpPhoto: localStorage.getItem('app_help_photo')
      }
    };

    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pro_jewellery_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsVaultMenuOpen(false);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          
          let importData = parsed;
          let isLegacy = true;

          // Check if new format
          if (parsed.metadata && parsed.metadata.type === 'PRO_JEWELLERY_FULL_BACKUP' && parsed.data) {
             importData = parsed.data;
             isLegacy = false;
          }

          if (isLegacy) {
              // Handle legacy array import (Inventory Entries only)
              if (Array.isArray(parsed)) {
                  if(window.confirm(`Legacy Backup Detected. Importing ${parsed.length} entries will merge with your current list. Proceed?`)) {
                      const current = storageService.getEntries();
                      const existingIds = new Set(current.map(e => e.id));
                      const toAdd = parsed.filter((e: any) => !existingIds.has(e.id));
                      const merged = [...current, ...toAdd];
                      
                      setEntries(merged);
                      storageService.saveEntries(merged);
                      alert(`Legacy Import Successful: Added ${toAdd.length} new entries.`);
                  }
              } else {
                  alert("Invalid file format.");
              }
          } else {
              // Handle Full System Import
              if(window.confirm(`Full System Backup Detected.\n\nThis will merge new data into your existing records:\n• Inventory & DAI Records\n• Notes & Contacts\n• Users & Settings\n\nExisting data will NOT be overwritten. Proceed?`)) {
                  
                  // Import logic... (Similar to existing)
                  if (Array.isArray(importData.entries)) {
                      const current = storageService.getEntries();
                      const existingIds = new Set(current.map(e => e.id));
                      const toAdd = importData.entries.filter((e: any) => !existingIds.has(e.id));
                      const merged = [...current, ...toAdd];
                      setEntries(merged);
                      storageService.saveEntries(merged);
                  }
                  
                  if (Array.isArray(importData.daiEntries)) {
                      const current = storageService.getDaiEntries();
                      const existingIds = new Set(current.map(e => e.id));
                      const toAdd = importData.daiEntries.filter((e: any) => !existingIds.has(e.id));
                      const merged = [...current, ...toAdd];
                      setDaiEntries(merged); // Update state too
                      storageService.saveDaiEntries(merged);
                  }

                  // ... other imports ...

                  // Refresh Users state
                  if (Array.isArray(importData.users)) {
                    const current = users;
                    const existingIds = new Set(current.map(u => u.id));
                    const toAdd = importData.users.filter((u: any) => !existingIds.has(u.id));
                    setUsers([...current, ...toAdd]);
                  }
                  
                  alert(`Full Import Successful! All data has been updated.`);
              }
          }
        } catch (err) {
          console.error(err);
          alert("Error parsing the file. Please ensure it is a valid backup file.");
        }
      };
      reader.readAsText(file);
    }
    setIsVaultMenuOpen(false);
    if(importInputRef.current) importInputRef.current.value = '';
  };

  return (
    <div className={`min-h-screen transition-all duration-500 pb-32`}>
      
      <Header 
        theme={theme} setTheme={setTheme} 
        settings={settings} setSettings={setSettings}
        users={activeUsers} currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        onAddUser={(name) => {
          const newUser = { id: crypto.randomUUID(), name };
          setUsers([...users, newUser]);
          setCurrentUserId(newUser.id);
        }}
        onUpdateUser={(u) => setUsers(users.map(user => user.id === u.id ? u : user))}
        onViewTrash={() => setView('trash')}
        trashCount={trashedEntries.length + trashedUsers.length + trashedDaiEntries.length}
        onSetView={setView}
        onShowOwnerDetails={() => setShowOwnerDetails(true)}
        onShowContact={() => setShowContact(true)}
        onShowAbout={() => setShowAbout(true)}
        onShowHelp={() => setShowHelp(true)}
        onShowEmergency={() => setShowEmergency(true)}
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
            <EntryForm onSubmit={handleAddEntry} currentUserId={currentUserId} users={activeUsers} />
          ) : (
            <EntryList 
              entries={view === 'list' ? filteredEntries : trashedEntries} 
              isTrashView={view === 'trash'}
              onDelete={(id) => handleAction(id, view === 'trash' ? 'permanent' : 'delete')} 
              onRestore={(id) => handleAction(id, 'restore')}
              onUpdate={handleUpdateEntry}
              currentUser={activeUser}
              trashedUsers={trashedUsers}
              onUserAction={handleUserAction}
              trashedDaiEntries={trashedDaiEntries}
              onDaiAction={handleDaiAction}
              onEmptyTrash={handleEmptyTrash}
            />
          )}
        </div>
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/5 z-[60]">
        <button
          onClick={() => setView('form')}
          className={`flex items-center gap-3 px-6 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
            view === 'form' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus size={18} /> Entry
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-3 px-6 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
            view === 'list' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <List size={18} /> Vault
        </button>
        
        {/* Menu Button Container */}
        <div className="relative">
            {isVaultMenuOpen && (
               <>
                 <div className="fixed inset-0 z-0" onClick={() => setIsVaultMenuOpen(false)}></div>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 p-2 flex flex-col gap-1">
                    <button onClick={() => { setIsVaultMenuOpen(false); setShowDaiNumber(true); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-white/5 hover:text-orange-600 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-3">
                       <Hash size={14} className="text-orange-400" /> DAI NUMBER
                    </button>
                    <button onClick={() => { setIsVaultMenuOpen(false); setShowDaiEntry(true); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-white/5 hover:text-orange-600 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-3">
                       <Plus size={14} className="text-orange-400" /> DAI ENTRY
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-white/5 mx-2"></div>
                    <button onClick={handleExportData} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-white/5 hover:text-orange-600 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-3">
                       <Download size={14} className="text-blue-400" /> EXPORT DATA
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-white/5 hover:text-orange-600 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-3">
                       <Upload size={14} className="text-green-400" /> IMPORT DATA
                    </button>
                 </div>
               </>
            )}
            <button
              onClick={() => setIsVaultMenuOpen(!isVaultMenuOpen)}
              className={`flex items-center gap-3 px-6 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                isVaultMenuOpen ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MoreVertical size={18} /> Menu
            </button>
        </div>
        <input 
            type="file" 
            ref={importInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImportData}
        />
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
      {showDaiNumber && (
        <DaiNumberModal onClose={() => setShowDaiNumber(false)} />
      )}
      {showDaiEntry && (
        <DaiEntryModal onClose={() => {
            setShowDaiEntry(false);
            setDaiEntries(storageService.getDaiEntries()); // Refresh tasks on close
        }} />
      )}
      {showOwnerDetails && <OwnerDetailsModal onClose={() => setShowOwnerDetails(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}

    </div>
  );
};

export default App;
