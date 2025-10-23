/* ============================================
   FILE SYSTEM ACCESS - Local folder management
   Using File System Access API for direct folder access
   ============================================ */

import { showNotification } from '../utils/dom.js';
import { debugLog } from '../utils/debug-logger.js';

let projectDirectoryHandle = null;
let assetsDirectoryHandle = null;
let projectFileHandle = null;

// IndexedDB for persisting directory handle
const DB_NAME = 'AutoExplainerDB';
const STORE_NAME = 'projectHandles';
const HANDLE_KEY = 'lastProjectHandle';

/**
 * Check if File System Access API is supported
 */
export function isFileSystemSupported() {
    return 'showDirectoryPicker' in window;
}

/**
 * Open IndexedDB
 */
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Save directory handle to IndexedDB
 */
async function saveDirectoryHandle(handle) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.put(handle, HANDLE_KEY);
        console.log('💾 Saved project handle to IndexedDB');
    } catch (err) {
        console.warn('Could not save handle to IndexedDB:', err);
    }
}

/**
 * Load directory handle from IndexedDB
 */
async function loadDirectoryHandle() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.get(HANDLE_KEY);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('Could not load handle from IndexedDB:', err);
        return null;
    }
}

/**
 * Verify we still have permission to access the directory
 */
async function verifyPermission(handle) {
    const opts = { mode: 'readwrite' };
    
    // Check if we already have permission
    if ((await handle.queryPermission(opts)) === 'granted') {
        return true;
    }
    
    // Request permission
    if ((await handle.requestPermission(opts)) === 'granted') {
        return true;
    }
    
    return false;
}

/**
 * Open folder picker dialog and get directory handle
 * @param {boolean} saveToIndexedDB - Whether to save for next session
 * @returns {Promise<DirectoryHandle>}
 */
export async function pickProjectFolder(saveToIndexedDB = true) {
    try {
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });
        
        projectDirectoryHandle = dirHandle;
        
        if (saveToIndexedDB) {
            await saveDirectoryHandle(dirHandle);
        }
        
        console.log('📁 Project folder selected:', dirHandle.name);
        showNotification(`Opened: ${dirHandle.name}`, 2000, 'success');
        
        return dirHandle;
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Error picking folder:', err);
            showNotification('Failed to open folder', 2000, 'error');
        }
        throw err;
    }
}

/**
 * Try to restore last opened project
 * @returns {Promise<boolean>} True if restored successfully
 */
export async function restoreLastProject() {
    try {
        const handle = await loadDirectoryHandle();
        
        if (!handle) {
            console.log('No previous project found');
            return false;
        }
        
        // Verify we still have permission
        const hasPermission = await verifyPermission(handle);
        
        if (!hasPermission) {
            console.log('Permission denied for last project');
            return false;
        }
        
        projectDirectoryHandle = handle;
        console.log('✅ Restored last project:', handle.name);
        
        return true;
    } catch (err) {
        console.warn('Could not restore last project:', err);
        return false;
    }
}

/**
 * Get or create assets subdirectory
 * @returns {Promise<DirectoryHandle>}
 */
export async function getOrCreateAssetsFolder() {
    if (!projectDirectoryHandle) {
        throw new Error('No project folder selected');
    }
    
    try {
        assetsDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle('assets', { create: true });
        console.log('📂 Assets folder ready');
        return assetsDirectoryHandle;
    } catch (err) {
        console.error('Error creating assets folder:', err);
        throw err;
    }
}

/**
 * Find or create project JSON file
 * @returns {Promise<{name: string, handle: FileHandle}>}
 */
export async function findOrCreateProjectFile() {
    if (!projectDirectoryHandle) {
        throw new Error('No project folder selected');
    }
    
    // Look for any .json file in the directory
    const entries = [];
    for await (const entry of projectDirectoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json') && !entry.name.startsWith('.')) {
            entries.push(entry);
        }
    }
    
    // If found, use first JSON file
    if (entries.length > 0) {
        projectFileHandle = entries[0];
        console.log('📄 Found project file:', projectFileHandle.name);
        return { name: projectFileHandle.name.replace('.json', ''), handle: projectFileHandle };
    }
    
    // If not found, create one using folder name
    const projectName = projectDirectoryHandle.name;
    const fileName = `${projectName}.json`;
    
    projectFileHandle = await projectDirectoryHandle.getFileHandle(fileName, { create: true });
    console.log('📄 Created project file:', fileName);
    
    // Write default project structure
    const defaultProject = createDefaultProject(projectName);
    await writeProjectFile(defaultProject);
    
    return { name: projectName, handle: projectFileHandle };
}

/**
 * Create default project structure
 */
function createDefaultProject(name) {
    return {
        "project": {
            "name": name,
            "duration": 10.0,
            "fps": 30,
            "viewport": {
                "width": 1280,
                "height": 720,
                "aspectRatio": "16:9"
            },
            "backgroundColor": "#ffffff"
        },
        "assets": [],
        "timeline": []
    };
}

/**
 * Read project JSON file
 * @returns {Promise<object>}
 */
export async function readProjectFile() {
    if (!projectFileHandle) {
        throw new Error('No project file selected');
    }
    
    try {
        const file = await projectFileHandle.getFile();
        const content = await file.text();
        
        if (!content || content.trim() === '') {
            // Empty file, return default
            const projectName = projectFileHandle.name.replace('.json', '');
            return createDefaultProject(projectName);
        }
        
        return JSON.parse(content);
    } catch (err) {
        console.error('Error reading project file:', err);
        throw err;
    }
}

/**
 * Write project JSON file
 * @param {object} projectData
 */
export async function writeProjectFile(projectData) {
    if (!projectFileHandle) {
        throw new Error('No project file selected');
    }
    
    try {
        const writable = await projectFileHandle.createWritable();
        await writable.write(JSON.stringify(projectData, null, 2));
        await writable.close();
    } catch (err) {
        console.error('Error writing project file:', err);
        throw err;
    }
}

/**
 * Save asset image to assets folder
 * @param {string} filename - Target filename (from JSON)
 * @param {File} file - Image file to save
 */
export async function saveAssetFile(filename, file) {
    if (!assetsDirectoryHandle) {
        await getOrCreateAssetsFolder();
    }
    
    try {
        const fileHandle = await assetsDirectoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        
        console.log('✅ Asset saved:', filename);
        showNotification(`Saved: ${filename}`, 1500, 'success');
    } catch (err) {
        console.error('Error saving asset:', err);
        showNotification(`Failed to save: ${filename}`, 2000, 'error');
        throw err;
    }
}

/**
 * Read asset file from assets folder
 * @param {string} filename
 * @returns {Promise<File>}
 */
export async function readAssetFile(filename) {
    if (!assetsDirectoryHandle) {
        await getOrCreateAssetsFolder();
    }
    
    try {
        const fileHandle = await assetsDirectoryHandle.getFileHandle(filename);
        return await fileHandle.getFile();
    } catch (err) {
        console.warn(`Asset not found: ${filename}`);
        return null;
    }
}

/**
 * List all files in assets folder
 * @returns {Promise<Array<string>>}
 */
export async function listAssetFiles() {
    if (!assetsDirectoryHandle) {
        await getOrCreateAssetsFolder();
    }
    
    const files = [];
    for await (const entry of assetsDirectoryHandle.values()) {
        if (entry.kind === 'file') {
            files.push(entry.name);
        }
    }
    
    return files;
}

/**
 * Manually reload project from disk (for external changes)
 * @returns {Promise<object>} Fresh project data
 */
export async function reloadProjectFromDisk() {
    if (!projectFileHandle) {
        throw new Error('No project file open');
    }
    
    console.log('🔄 Reloading project from disk...');
    return await readProjectFile();
}

/**
 * Get current project folder name
 */
export function getProjectFolderName() {
    return projectDirectoryHandle?.name || null;
}

/**
 * Check if project folder is open
 */
export function hasProjectFolder() {
    return projectDirectoryHandle !== null;
}

