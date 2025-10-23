/* ============================================
   DEBUG LOGGER - Persistent logging with visible panel
   ============================================ */

const MAX_LOGS = 100;
const LOG_KEY = 'autoexplainer_debug_logs';

/**
 * Add debug log entry (persists across reloads)
 */
export function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = {
        timestamp,
        message,
        data
    };
    
    // Console log
    console.log(`[DEBUG ${timestamp}]`, message, data || '');
    
    // Persist to localStorage
    try {
        const logs = getDebugLogs();
        logs.push(entry);
        
        // Keep only last MAX_LOGS entries
        if (logs.length > MAX_LOGS) {
            logs.shift();
        }
        
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (err) {
        console.warn('Could not save debug log:', err);
    }
    
    // Update visible panel if it exists
    updateDebugPanel();
}

/**
 * Get all debug logs
 */
export function getDebugLogs() {
    try {
        const stored = localStorage.getItem(LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        return [];
    }
}

/**
 * Clear debug logs
 */
export function clearDebugLogs() {
    localStorage.removeItem(LOG_KEY);
    console.log('Debug logs cleared');
}

/**
 * Show debug logs in console
 */
export function showDebugLogs() {
    const logs = getDebugLogs();
    console.log('=== DEBUG LOGS ===');
    logs.forEach(log => {
        console.log(`[${log.timestamp}] ${log.message}`, log.data || '');
    });
    console.log('=== END DEBUG LOGS ===');
}

/**
 * Create/show visible debug panel
 */
export function createDebugPanel() {
    let panel = document.getElementById('debugPanel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = `
            position: fixed;
            bottom: 7px;
            right: 7px;
            width: 280px;
            max-height: 210px;
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            font-family: monospace;
            font-size: 7.7px;
            padding: 7px;
            border: 1.4px solid #0f0;
            border-radius: 3.5px;
            overflow-y: auto;
            z-index: 99999;
            box-shadow: 0 2.8px 14px rgba(0, 255, 0, 0.3);
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 7px;
            padding-bottom: 3.5px;
            border-bottom: 0.7px solid #0f0;
            position: sticky;
            top: 0;
            background: rgba(0, 0, 0, 0.95);
        `;
        header.innerHTML = `
            <span style="color: #0ff; font-weight: bold;">🐛 DEBUG LOGS</span>
            <button onclick="window.toggleDebugPanel()" style="background: #0f0; color: #000; border: none; padding: 1.4px 5.6px; border-radius: 2.1px; cursor: pointer; font-size: 7px;">Hide</button>
        `;
        
        const logsDiv = document.createElement('div');
        logsDiv.id = 'debugLogsList';
        logsDiv.style.cssText = 'line-height: 1.4;';
        
        panel.appendChild(header);
        panel.appendChild(logsDiv);
        document.body.appendChild(panel);
    }
    
    updateDebugPanel();
    return panel;
}

/**
 * Update debug panel with latest logs
 */
function updateDebugPanel() {
    const logsList = document.getElementById('debugLogsList');
    if (!logsList) return;
    
    const logs = getDebugLogs();
    const html = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const dataStr = log.data ? `<div style="color: #888; margin-left: 14px; font-size: 7px;">${JSON.stringify(log.data)}</div>` : '';
        return `<div style="margin-bottom: 3.5px; color: #0f0;">[${time}] ${log.message}${dataStr}</div>`;
    }).join('');
    
    logsList.innerHTML = html || '<div style="color: #888;">No logs yet...</div>';
    
    // Auto-scroll to bottom
    logsList.scrollTop = logsList.scrollHeight;
}

/**
 * Toggle debug panel visibility
 */
export function toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
        createDebugPanel();
    }
}

/**
 * Download logs as file
 */
export function downloadDebugLogs() {
    const logs = getDebugLogs();
    const content = logs.map(log => {
        return `[${log.timestamp}] ${log.message}\n${log.data ? JSON.stringify(log.data, null, 2) : ''}`;
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Expose to window for console access
if (typeof window !== 'undefined') {
    window.showDebugLogs = showDebugLogs;
    window.clearDebugLogs = clearDebugLogs;
    window.toggleDebugPanel = toggleDebugPanel;
    window.downloadDebugLogs = downloadDebugLogs;
}

