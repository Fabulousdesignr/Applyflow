import React, { useState, useEffect } from 'react';
import { 
  getOpportunities, 
  saveOpportunity, 
  deleteOpportunity, 
  getSettings 
} from './database/db';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SpreadsheetGrid from './components/SpreadsheetGrid';
import CategoriesGrid from './components/CategoriesGrid';
import UploadArea from './components/UploadArea';
import DetailSidePanel from './components/DetailSidePanel';
import SettingsModal from './components/SettingsModal';
import { Sparkles, SlidersHorizontal, Cloud, Menu } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Drawer & Modals states
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings sync label state
  const [syncStatus, setSyncStatus] = useState('Offline-first');

  // Load database rows on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOpportunities();
      setOpportunities(data);
      
      // Update active sync status indicators
      const settings = getSettings();
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        setSyncStatus('Supabase SQL Synced');
      } else {
        setSyncStatus('Offline-first (LocalStorage)');
      }
    } catch (e) {
      console.error("Error loading opportunities:", e);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Actions
  const handleSaveOpportunity = async (opp) => {
    try {
      const saved = await saveOpportunity(opp);
      setOpportunities(prev => {
        const index = prev.findIndex(item => item.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        } else {
          return [saved, ...prev];
        }
      });
      // If the currently open drawer opportunity is being edited, sync the drawer state
      if (selectedOpp && selectedOpp.id === saved.id) {
        setSelectedOpp(saved);
      }
    } catch (e) {
      console.error("Error saving opportunity:", e);
    }
  };

  const handleDeleteOpportunity = async (id) => {
    try {
      await deleteOpportunity(id);
      setOpportunities(prev => prev.filter(item => item.id !== id));
      if (selectedOpp && selectedOpp.id === id) {
        setSelectedOpp(null);
      }
    } catch (e) {
      console.error("Error deleting opportunity:", e);
    }
  };

  // Batch import from Uploader
  const handleImportRows = async (rows) => {
    try {
      for (const row of rows) {
        await saveOpportunity(row);
      }
      await loadData(); // Reload list to sync everything
    } catch (e) {
      console.error("Error importing parsed batch:", e);
    }
  };

  // Preset categories routing bridge
  const handleSelectCategoryPreset = (categoryId) => {
    setCurrentTab('database');
    // We pass a simple trigger to the Grid view by setting states inside App
    // Wait, SpreadsheetGrid inside handles matching category filters. We can set filters locally.
    // To make it easy, we can search for the selector matching that category!
    // In our categories page:
    // ai_startups -> Set Type Filter dropdown to 'AI Startup'
    // saas -> Set Type Filter dropdown to 'SaaS'
    // fintech -> Set Type Filter dropdown to 'Fintech'
    // product_studios -> Set Type Filter dropdown to 'Agency'
    // nocode -> Set Type Filter dropdown to 'No-Code Studio'
    
    // We will let the Spreadsheet view mount, and we can pass the filter preset as a parameter or state.
    // Let's pass categoryId down so that we can trigger preset changes in SpreadsheetGrid.jsx!
    // We can simulate filter button clicks by setting the preset filter directly in the grid.
    
    // We can achieve this elegantly by letting the DOM know which category was clicked.
    // Let's save a state:
    localStorage.setItem('applyflow_grid_initial_preset', categoryId);
  };

  return (
    <div className="app-container">
      
      {/* 1. Left Notion-Style Navigation Sidebar */}
      <div className={`sidebar-container-mobile-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar 
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            setMobileSidebarOpen(false); // Auto-close sidebar on link click on mobile!
          }}
          opportunities={opportunities}
          openSettings={() => {
            setIsSettingsOpen(true);
            setMobileSidebarOpen(false);
          }}
        />
      </div>

      {/* Dim overlay behind sidebar when open on mobile */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* 2. Primary Operations Hub View */}
      <main className="main-content">
        
        {/* Top Header bar */}
        <header className="app-header">
          <div className="header-title-section">
            {/* Hamburger menu button visible only on mobile */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="icon-btn mobile-menu-toggle"
              style={{ marginRight: '8px' }}
              title="Open Navigation"
            >
              <Menu size={16} />
            </button>

            <span className="header-title">
              {currentTab === 'dashboard' && 'Operations Dashboard'}
              {currentTab === 'database' && 'Opportunities Spreadsheet'}
              {currentTab === 'categories' && 'Research Categories'}
              {currentTab === 'upload' && 'AI Document Parser'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="header-sync-pill" style={{
                fontSize: '10px',
                backgroundColor: syncStatus.includes('Supabase') ? 'rgba(16, 185, 129, 0.08)' : '#1c1e23',
                border: syncStatus.includes('Supabase') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #2d3039',
                color: syncStatus.includes('Supabase') ? '#34d399' : '#9ca3af',
                padding: '2px 6px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Cloud size={10} />
                <span>{syncStatus}</span>
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="btn btn-secondary"
              title="Database Sync Settings"
            >
              <SlidersHorizontal size={13} />
              <span>Sync Panel</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body Render Wrapped in Scroll Bounded Div */}
        {loading ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '8px' }}>
            <span className="spinner" style={{ border: '2px solid transparent', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            <span>Loading spreadsheet pipeline...</span>
          </div>
        ) : (
          <div className="tab-body">
            {currentTab === 'dashboard' && (
              <Dashboard 
                opportunities={opportunities} 
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onSelectRow={(opp) => setSelectedOpp(opp)}
              />
            )}
            {currentTab === 'database' && (
              <SpreadsheetGrid 
                opportunities={opportunities}
                onSaveRow={handleSaveOpportunity}
                onDeleteRow={handleDeleteOpportunity}
                onOpenDrawer={(opp) => setSelectedOpp(opp)}
                selectedOpp={selectedOpp}
                setSelectedOpp={setSelectedOpp}
              />
            )}
            {currentTab === 'categories' && (
              <CategoriesGrid 
                opportunities={opportunities}
                onSelectCategoryPreset={handleSelectCategoryPreset}
              />
            )}
            {currentTab === 'upload' && (
              <UploadArea 
                opportunities={opportunities}
                onImportRows={handleImportRows}
              />
            )}
          </div>
        )}

        {/* Notion Drawer strategy details (Slide drawer) */}
        {selectedOpp && (
          <DetailSidePanel 
            opportunity={selectedOpp}
            onClose={() => setSelectedOpp(null)}
            onSave={handleSaveOpportunity}
            onDelete={handleDeleteOpportunity}
          />
        )}

        {/* Global Settings & Credentials sync modal */}
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSyncComplete={loadData}
        />
      </main>

      {/* Basic rotating spinner keyframe */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
