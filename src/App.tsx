import React, { useState } from 'react';
import { TriageProvider, useTriage } from './context/TriageContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { SearchTermExplorer } from './components/SearchTermExplorer';
import { HumanReviewCenter } from './components/HumanReviewCenter';
import { CsvImportSection } from './components/CsvImportSection';
import { ExportCenter } from './components/ExportCenter';
import { MethodologySection } from './components/MethodologySection';
import { EvidenceDrawer } from './components/EvidenceDrawer';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [explorerFilter, setExplorerFilter] = useState<{
    action?: string;
    review?: boolean;
    campaign?: string;
  } | undefined>(undefined);

  const { selectedResult, setSelectedResult } = useTriage();

  const handleNavigateToExplorer = (filter?: {
    action?: string;
    review?: boolean;
    campaign?: string;
  }) => {
    setExplorerFilter(filter);
    setActiveTab('explorer');
  };

  const handleNavigateToReview = () => {
    setActiveTab('review');
  };

  const handleNavigateToImport = () => {
    setActiveTab('import');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onNavigateToImport={handleNavigateToImport} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewDashboard
              onNavigateToExplorer={handleNavigateToExplorer}
              onNavigateToReview={handleNavigateToReview}
            />
          )}

          {activeTab === 'explorer' && (
            <SearchTermExplorer initialFilter={explorerFilter} />
          )}

          {activeTab === 'review' && <HumanReviewCenter />}

          {activeTab === 'import' && <CsvImportSection />}

          {activeTab === 'export' && <ExportCenter />}

          {activeTab === 'methodology' && <MethodologySection />}
        </main>
      </div>

      {/* Evidence & Decision Detail Drawer */}
      <EvidenceDrawer
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TriageProvider>
      <AppContent />
    </TriageProvider>
  );
}
