/* ============================================
   PROJECT MANAGEMENT V2 - Local Filesystem Version
   ============================================ */

import { state, setState, resetState } from '../state/state.js';
import { getById, showNotification } from '../utils/dom.js';
import { 
    pickProjectFolder, 
    restoreLastProject,
    findOrCreateProjectFile,
    getOrCreateAssetsFolder,
    readProjectFile,
    writeProjectFile,
    reloadProjectFromDisk,
    getProjectFolderName,
    hasProjectFolder,
    isFileSystemSupported
} from '../api/filesystem.js';
import { loadProjectAssets, renderAssetSidebar } from './assets-v2.js';
import { setupViewport } from '../viewport/viewport.js';
import { setupTimeline } from '../timeline/timeline.js';
import { initHistory, recordChange } from './history.js';
import { debugLog } from '../utils/debug-logger.js';

// Track page unloads
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        debugLog('⚠️ PAGE UNLOAD EVENT', null);
    });
}

/**
 * Open project folder picker
 */
export async function openProjectFolder() {
    if (!isFileSystemSupported()) {
        alert('Your browser doesn\'t support folder access. Please use Chrome, Edge, or Opera.');
        return;
    }
    
    try {
        // Pick folder
        await pickProjectFolder();
        
        // Initialize project
        await initializeProject();
        
        showNotification(`✓ Project opened`, 2000, 'success');
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Failed to open project:', err);
            alert('Failed to open project folder: ' + err.message);
        }
    }
}

/**
 * Try to auto-restore last project on startup
 */
export async function autoRestoreProject() {
    debugLog('🔍 AUTO-RESTORE attempt', null);
    
    try {
        const restored = await restoreLastProject();
        
        if (!restored) {
            debugLog('ℹ️ No saved project found', null);
            console.log('No previous project to restore');
            return false;
        }
        
        debugLog('✅ Found saved project, initializing...', null);
        // Initialize project
        await initializeProject();
        
        debugLog('✅ AUTO-RESTORE complete', null);
        console.log('✅ Auto-restored last project');
        return true;
    } catch (err) {
        debugLog('❌ AUTO-RESTORE failed', { error: err.message });
        console.warn('Could not auto-restore project:', err);
        return false;
    }
}

/**
 * Initialize project (load files, setup UI)
 */
async function initializeProject() {
    // Create/find project structure
    await getOrCreateAssetsFolder();
    const { name } = await findOrCreateProjectFile();
    
    // Load project
    const projectData = await readProjectFile();
    loadProject(projectData);
    
    // Load assets
    await loadProjectAssets();
    
    // Initialize history
    initHistory();
}

/**
 * Load project data into state
 */
function loadProject(data) {
    debugLog('📂 LOAD PROJECT into state', { name: data.project?.name });
    
    state.project = data;
    state.loadedAssets = {};
    state.currentTime = 0;
    state.isPlaying = false;
    state.selection.block = null;
    state.selection.element = null;
    
    // Update UI
    // Project name now shown in projectFolderName only
    getById('projectFolderName').textContent = `📁 ${getProjectFolderName()}`;
    
    // Initialize assets dictionary
    if (state.project.assets) {
        state.project.assets.forEach(asset => {
            state.loadedAssets[asset.id] = null;
        });
    }
    
    // Setup UI components
    renderAssetSidebar();
    setupViewport();
    setupTimeline();
    
    // Update frame display
    if (typeof window !== 'undefined' && window.updateFrameDisplay) {
        window.updateFrameDisplay();
    }
    
    debugLog('✅ Project loaded into UI', null);
}

/**
 * Manually reload project from disk (user-initiated)
 */
export async function reloadProject() {
    if (!hasProjectFolder()) {
        showNotification('No project open', 2000, 'error');
        return;
    }
    
    try {
        console.log('🔄 Reloading project from disk...');
        const projectData = await reloadProjectFromDisk();
        loadProject(projectData);
        await loadProjectAssets();
        
        const { updateViewport } = await import('../viewport/viewport.js');
        updateViewport();
        
        showNotification('🔄 Reloaded from disk', 1500, 'success');
    } catch (err) {
        console.error('Error reloading project:', err);
        showNotification('Reload failed', 2000, 'error');
    }
}

/**
 * Save project
 */
export async function saveProject() {
    if (!state.project || !hasProjectFolder()) {
        showNotification('No project open', 2000, 'error');
        return;
    }
    
    try {
        await writeProjectFile(state.project);
        console.log('💾 Project saved');
    } catch (err) {
        console.error('Save failed:', err);
        showNotification('Save failed', 2000, 'error');
    }
}

/**
 * Queue auto-save (debounced)
 */
let saveTimeout = null;
export function queueProjectSave(description = 'Auto-save') {
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(() => {
        saveProject();
        if (description !== 'Auto-save') {
            recordChange(description);
        }
    }, 500);
}

/**
 * Add new asset to project
 * @param {string} assetId - Asset identifier
 * @param {string} filename - Filename for the asset
 * @param {string} type - Asset type (image, etc)
 */
export function addAssetToProject(assetId, filename, type = 'image') {
    if (!state.project) return;
    
    // Check if asset already exists
    const existing = state.project.assets.find(a => a.id === assetId);
    if (existing) {
        console.log('Asset already exists:', assetId);
        return;
    }
    
    // Add new asset
    const newAsset = {
        id: assetId,
        filename: filename,
        type: type,
        defaultSize: { width: 200, height: 200 }
    };
    
    state.project.assets.push(newAsset);
    state.loadedAssets[assetId] = null;
    
    recordChange(`Added asset: ${assetId}`);
    queueProjectSave();
    renderAssetSidebar();
}

/**
 * Remove asset from project
 */
export function removeAssetFromProject(assetId) {
    if (!state.project) return;
    
    const index = state.project.assets.findIndex(a => a.id === assetId);
    if (index === -1) return;
    
    state.project.assets.splice(index, 1);
    delete state.loadedAssets[assetId];
    
    recordChange(`Removed asset: ${assetId}`);
    queueProjectSave();
    renderAssetSidebar();
}

// UI helper
export function showHistoryPanel() {
    getById('historyPanel').classList.remove('hidden');
}

export function hideHistoryPanel() {
    getById('historyPanel').classList.add('hidden');
}

