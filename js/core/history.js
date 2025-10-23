/* ============================================
   HISTORY - Undo/Redo System with Version Control
   ============================================ */

import { state, cloneProjectData } from '../state/state.js';
import { writeProjectFile } from '../api/filesystem.js';
import { showNotification } from '../utils/dom.js';

// History state
const history = {
    snapshots: [],           // Array of project state snapshots
    currentIndex: -1,        // Current position in history
    maxSnapshots: 50,        // Maximum snapshots to keep
    isUndoRedo: false,       // Flag to prevent recording during undo/redo
    unsavedChanges: false    // Track if there are unsaved changes
};

/**
 * Initialize history with current project state
 */
export function initHistory() {
    if (!state.project) return;
    
    history.snapshots = [createSnapshot('Project opened')];
    history.currentIndex = 0;
    history.unsavedChanges = false;
    
    console.log('📜 History initialized');
}

/**
 * Create a snapshot of current project state
 * @param {string} description - What changed
 * @returns {object} Snapshot object
 */
function createSnapshot(description) {
    return {
        timestamp: Date.now(),
        description: description,
        data: cloneProjectData(state.project)
    };
}

/**
 * Record a change in history
 * @param {string} description - Description of the change
 */
export function recordChange(description) {
    if (!state.project || history.isUndoRedo) return;
    
    // Remove any snapshots after current index (branch cut-off)
    if (history.currentIndex < history.snapshots.length - 1) {
        history.snapshots = history.snapshots.slice(0, history.currentIndex + 1);
    }
    
    // Add new snapshot
    history.snapshots.push(createSnapshot(description));
    history.currentIndex++;
    
    // Limit history size
    if (history.snapshots.length > history.maxSnapshots) {
        history.snapshots.shift();
        history.currentIndex--;
    }
    
    history.unsavedChanges = true;
    
    console.log(`📝 Recorded: ${description} (${history.currentIndex + 1}/${history.snapshots.length})`);
    updateHistoryUI();
}

/**
 * Undo last change
 */
export async function undo() {
    if (!canUndo()) {
        showNotification('Nothing to undo', 1000, 'info');
        return;
    }
    
    history.currentIndex--;
    await restoreSnapshot(history.snapshots[history.currentIndex]);
    
    console.log(`↶ Undo: ${history.snapshots[history.currentIndex].description}`);
    showNotification('↶ Undo', 1000, 'info');
}

/**
 * Redo last undone change
 */
export async function redo() {
    if (!canRedo()) {
        showNotification('Nothing to redo', 1000, 'info');
        return;
    }
    
    history.currentIndex++;
    await restoreSnapshot(history.snapshots[history.currentIndex]);
    
    console.log(`↷ Redo: ${history.snapshots[history.currentIndex].description}`);
    showNotification('↷ Redo', 1000, 'info');
}

/**
 * Restore a snapshot
 */
async function restoreSnapshot(snapshot) {
    history.isUndoRedo = true;
    
    state.project = cloneProjectData(snapshot.data);
    
    // Trigger full UI refresh
    const { updateViewport } = await import('../viewport/viewport.js');
    const { renderTimeline } = await import('../timeline/timeline.js');
    const { renderAssetSidebar } = await import('../core/assets-v2.js');
    
    renderAssetSidebar();
    renderTimeline();
    updateViewport();
    
    history.isUndoRedo = false;
    history.unsavedChanges = true;
}

/**
 * Can undo?
 */
export function canUndo() {
    return history.currentIndex > 0;
}

/**
 * Can redo?
 */
export function canRedo() {
    return history.currentIndex < history.snapshots.length - 1;
}

/**
 * Save current state and mark as saved
 */
export async function saveWithHistory() {
    if (!state.project) return;
    
    try {
        await writeProjectFile(state.project);
        history.unsavedChanges = false;
        showNotification('✓ Saved', 1500, 'success');
        updateHistoryUI();
    } catch (err) {
        console.error('Save failed:', err);
        showNotification('Save failed', 2000, 'error');
    }
}

/**
 * Get history for display
 */
export function getHistory() {
    return {
        snapshots: history.snapshots.map((s, i) => ({
            index: i,
            timestamp: s.timestamp,
            description: s.description,
            isCurrent: i === history.currentIndex
        })),
        currentIndex: history.currentIndex,
        canUndo: canUndo(),
        canRedo: canRedo(),
        unsavedChanges: history.unsavedChanges
    };
}

/**
 * Jump to specific snapshot in history
 * @param {number} index
 */
export async function jumpToSnapshot(index) {
    if (index < 0 || index >= history.snapshots.length) return;
    
    history.currentIndex = index;
    await restoreSnapshot(history.snapshots[index]);
    
    console.log(`⟲ Jumped to: ${history.snapshots[index].description}`);
    showNotification('⟲ Time traveled', 1000, 'info');
}

/**
 * Update history UI indicators
 */
function updateHistoryUI() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const saveIndicator = document.getElementById('saveIndicator');
    
    if (undoBtn) {
        undoBtn.disabled = !canUndo();
        undoBtn.style.opacity = canUndo() ? '1' : '0.5';
    }
    
    if (redoBtn) {
        redoBtn.disabled = !canRedo();
        redoBtn.style.opacity = canRedo() ? '1' : '0.5';
    }
    
    if (saveIndicator) {
        saveIndicator.textContent = history.unsavedChanges ? '● Unsaved' : '✓ Saved';
        saveIndicator.style.color = history.unsavedChanges ? '#FFD700' : '#4CAF50';
    }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    
    return date.toLocaleString();
}

// Expose to window for HTML onclick
if (typeof window !== 'undefined') {
    window.undo = undo;
    window.redo = redo;
    window.saveProject = saveWithHistory;
}

