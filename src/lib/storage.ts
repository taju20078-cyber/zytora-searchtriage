import { ReviewerDecision } from '../types/searchTerm';

const STORAGE_KEY = 'searchiq_reviewer_decisions_v1';

// In-memory fallback for test runners or environments without localStorage
let memoryFallback: Record<string | number, ReviewerDecision> = {};

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

export function loadReviewerDecisions(): Record<string | number, ReviewerDecision> {
  const storage = getStorage();
  if (!storage) {
    return { ...memoryFallback };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load reviewer decisions', err);
    return {};
  }
}

export function saveReviewerDecision(decision: ReviewerDecision): void {
  const storage = getStorage();
  if (!storage) {
    memoryFallback[decision.row_id] = decision;
    return;
  }
  try {
    const current = loadReviewerDecisions();
    current[decision.row_id] = decision;
    storage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save reviewer decision', err);
  }
}

export function removeReviewerDecision(rowId: string | number): void {
  const storage = getStorage();
  if (!storage) {
    delete memoryFallback[rowId];
    return;
  }
  try {
    const current = loadReviewerDecisions();
    delete current[rowId];
    storage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to remove reviewer decision', err);
  }
}

export function clearAllReviewerDecisions(): void {
  const storage = getStorage();
  if (!storage) {
    memoryFallback = {};
    return;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear reviewer decisions', err);
  }
}
