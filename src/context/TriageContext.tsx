import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { RawSearchTermRow, ReviewerDecision, TriageResult } from '../types/searchTerm';
import { DEMO_DATASET } from '../data/demoDataset';
import { classifyTerm } from '../engine/classifyTerm';
import { clearAllReviewerDecisions, loadReviewerDecisions, saveReviewerDecision as saveStorageDecision } from '../lib/storage';

interface ActiveFileMeta {
  name: string;
  source: 'demo' | 'uploaded';
  rowCount: number;
  loadedAt: string;
}

interface TriageContextType {
  rawRows: RawSearchTermRow[];
  classifiedResults: TriageResult[];
  reviewerDecisions: Record<string | number, ReviewerDecision>;
  activeFileMeta: ActiveFileMeta;
  isLoading: boolean;
  selectedResult: TriageResult | null;
  setSelectedResult: (result: TriageResult | null) => void;
  loadDataset: (rows: RawSearchTermRow[], filename: string, isUploaded?: boolean) => void;
  loadDemoData: () => void;
  saveDecision: (decision: ReviewerDecision) => void;
  resetAllDecisions: () => void;
  allCampaigns: string[];
  allAdGroups: string[];
}

const TriageContext = createContext<TriageContextType | undefined>(undefined);

export const TriageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawRows, setRawRows] = useState<RawSearchTermRow[]>(DEMO_DATASET);
  const [activeFileMeta, setActiveFileMeta] = useState<ActiveFileMeta>({
    name: 'demo_kestrel_90d_sample.csv',
    source: 'demo',
    rowCount: DEMO_DATASET.length,
    loadedAt: new Date().toLocaleTimeString(),
  });
  const [reviewerDecisions, setReviewerDecisions] = useState<Record<string | number, ReviewerDecision>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<TriageResult | null>(null);

  // Initialize stored decisions
  useEffect(() => {
    const loaded = loadReviewerDecisions();
    setReviewerDecisions(loaded);
  }, []);

  // Classify rows deterministically
  const classifiedResults = useMemo(() => {
    return rawRows.map((row) => classifyTerm(row));
  }, [rawRows]);

  const allCampaigns = useMemo(() => {
    const set = new Set<string>();
    rawRows.forEach((r) => set.add(r.campaign));
    return Array.from(set).sort();
  }, [rawRows]);

  const allAdGroups = useMemo(() => {
    const set = new Set<string>();
    rawRows.forEach((r) => set.add(r.ad_group));
    return Array.from(set).sort();
  }, [rawRows]);

  const loadDataset = useCallback((rows: RawSearchTermRow[], filename: string, isUploaded = true) => {
    setIsLoading(true);
    // Process smoothly
    setTimeout(() => {
      setRawRows(rows);
      setActiveFileMeta({
        name: filename,
        source: isUploaded ? 'uploaded' : 'demo',
        rowCount: rows.length,
        loadedAt: new Date().toLocaleTimeString(),
      });
      setIsLoading(false);
    }, 50);
  }, []);

  const loadDemoData = useCallback(() => {
    loadDataset(DEMO_DATASET, 'demo_kestrel_90d_sample.csv', false);
  }, [loadDataset]);

  const saveDecision = useCallback((decision: ReviewerDecision) => {
    saveStorageDecision(decision);
    setReviewerDecisions((prev) => ({
      ...prev,
      [decision.row_id]: decision,
    }));
  }, []);

  const resetAllDecisions = useCallback(() => {
    clearAllReviewerDecisions();
    setReviewerDecisions({});
  }, []);

  return (
    <TriageContext.Provider
      value={{
        rawRows,
        classifiedResults,
        reviewerDecisions,
        activeFileMeta,
        isLoading,
        selectedResult,
        setSelectedResult,
        loadDataset,
        loadDemoData,
        saveDecision,
        resetAllDecisions,
        allCampaigns,
        allAdGroups,
      }}
    >
      {children}
    </TriageContext.Provider>
  );
};

export function useTriage(): TriageContextType {
  const context = useContext(TriageContext);
  if (!context) {
    throw new Error('useTriage must be used within a TriageProvider');
  }
  return context;
}
