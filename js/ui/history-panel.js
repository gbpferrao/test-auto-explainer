/* ============================================
   HISTORY PANEL - Version Control UI
   ============================================ */

import { getHistory, jumpToSnapshot, formatTimestamp } from '../core/history.js';
import { getById, createElement, clearElement } from '../utils/dom.js';

/**
 * Render history panel
 */
export function renderHistoryPanel() {
    const panel = getById('historyPanel');
    if (!panel || panel.classList.contains('hidden')) return;
    
    const historyList = getById('historyList');
    if (!historyList) return;
    
    clearElement(historyList);
    
    const history = getHistory();
    
    if (history.snapshots.length === 0) {
        historyList.innerHTML = '<div style="color: #666; padding: 7px; text-align: center;">No history yet</div>';
        return;
    }
    
    // Render snapshots in reverse order (newest first)
    const snapshots = [...history.snapshots].reverse();
    
    snapshots.forEach((snapshot, reverseIndex) => {
        const index = history.snapshots.length - 1 - reverseIndex;
        const isCurrent = snapshot.isCurrent;
        
        const item = createElement('div', {
            classes: ['history-item', isCurrent ? 'current' : ''].filter(Boolean),
            attributes: { 'data-index': index }
        });
        
        const timeStr = formatTimestamp(snapshot.timestamp);
        const indicator = isCurrent ? '👉 ' : '';
        
        item.innerHTML = `
            <div class="history-item-header">
                <span class="history-indicator">${indicator}</span>
                <span class="history-description">${snapshot.description}</span>
            </div>
            <div class="history-timestamp">${timeStr}</div>
        `;
        
        item.addEventListener('click', () => {
            if (!isCurrent) {
                jumpToSnapshot(index);
                renderHistoryPanel();
            }
        });
        
        historyList.appendChild(item);
    });
    
    // Update stats
    const statsEl = getById('historyStats');
    if (statsEl) {
        statsEl.textContent = `${history.snapshots.length} snapshots • ${history.unsavedChanges ? 'Unsaved changes' : 'All saved'}`;
    }
}

/**
 * Toggle history panel
 */
export function toggleHistoryPanel() {
    const panel = getById('historyPanel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        renderHistoryPanel();
    } else {
        panel.classList.add('hidden');
    }
}

// Expose to window
if (typeof window !== 'undefined') {
    window.toggleHistoryPanel = toggleHistoryPanel;
    window.renderHistoryPanel = renderHistoryPanel;
}

