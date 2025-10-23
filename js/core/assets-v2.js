/* ============================================
   ASSET MANAGEMENT V2 - Local Filesystem Version
   ============================================ */

import { state } from '../state/state.js';
import { getById, createElement, showNotification } from '../utils/dom.js';
import { hexToRgb } from '../utils/math.js';
import { saveAssetFile, readAssetFile, listAssetFiles } from '../api/filesystem.js';
import { updateViewport } from '../viewport/viewport.js';
import { queueProjectSave, addAssetToProject } from './project-v2.js';
import { recordChange } from './history.js';
import { renderTimeline } from '../timeline/timeline.js';

/**
 * Render asset sidebar (media assets + text objects)
 */
export function renderAssetSidebar() {
    if (!state.project) return;
    
    const assetList = getById('assetList');
    assetList.innerHTML = '';
    
    // Filter assets: include those that are used in the timeline OR are background assets
    const usedAssets = state.project.assets.filter(asset => 
        asset.isBackground || state.project.timeline.some(item => item.assetId === asset.id)
    );

    const hasUsedAssets = usedAssets.length > 0;
    const textObjects = state.project.timeline?.filter(item => item.type === 'text') || [];
    const hasTextObjects = textObjects.length > 0;
    
    if (!hasUsedAssets && !hasTextObjects) {
        assetList.innerHTML = `
            <div style="text-align: center; color: #666; padding: 14px; font-size: 8.4px;">
                No content yet.<br>
                Use the toolbar to add.
            </div>
        `;
        setupGlobalDropZone();
        return;
    }
    
    // Render media assets (only those actually used in timeline)
    if (hasUsedAssets) {
        usedAssets.forEach((asset) => {
            const assetItem = createAssetItem(asset);
            assetList.appendChild(assetItem);
        });
    }
    
    // Render text objects
    if (hasTextObjects) {
        textObjects.forEach((textObj) => {
            const timelineIndex = state.project.timeline.indexOf(textObj);
            const textItem = createTextObjectItem(textObj, timelineIndex);
            assetList.appendChild(textItem);
        });
    }
    
    setupGlobalDropZone();
    
    // Setup click-on-empty-space to deselect
    const sidebar = getById('assetSidebar');
    if (sidebar) {
        sidebar.addEventListener('click', async (e) => {
            // If clicked directly on sidebar or asset list (not on an item), deselect
            if (e.target === sidebar || e.target === assetList) {
                const { clearSelection } = await import('../ui/selection-manager.js');
                clearSelection();
            }
        });
    }
}

/**
 * Create text object item for sidebar (standardized to match asset items)
 */
function createTextObjectItem(textObj, timelineIndex) {
    const textItem = createElement('div', {
        classes: ['asset-item', 'text-item'],
        attributes: { 'data-timeline-index': timelineIndex }
    });
    
    const previewText = textObj.text || 'Empty text';
    
    textItem.innerHTML = `
        <button class="asset-item-delete" onclick="deleteTimelineItem(${timelineIndex})" title="Delete text">×</button>
        <div class="asset-name" ondblclick="renameTextObject(${timelineIndex})" title="Double-click to rename">
            📝 ${textObj.assetId || 'text_' + timelineIndex}
            <button class="asset-rename-btn" onclick="renameTextObject(${timelineIndex})" title="Rename">✏️</button>
        </div>
        <div class="text-preview-editable" 
             contenteditable="true" 
             spellcheck="false"
             data-timeline-index="${timelineIndex}"
             title="Click to edit text"
             style="background: var(--bg-darker); padding: 7px; border-radius: 2.8px; font-size: 7.7px; color: var(--text-primary); min-height: 70px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: text; overflow-wrap: break-word; word-break: break-word;">${previewText}</div>
    `;
    
    // Add event listener to rename button to prevent propagation
    const renameBtn = textItem.querySelector('.asset-rename-btn');
    if (renameBtn) {
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Setup editable text preview
    const textPreview = textItem.querySelector('.text-preview-editable');
    if (textPreview) {
        // Prevent click from selecting the element when editing
        textPreview.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Save on blur (when user clicks away)
        textPreview.addEventListener('blur', (e) => {
            const newText = e.target.textContent.trim();
            if (newText !== textObj.text) {
                updateTextContent(timelineIndex, newText);
            }
        });
        
        // Save on Enter key
        textPreview.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.target.blur(); // Trigger save
            }
            // Allow Shift+Enter for line breaks
        });
        
        // Update placeholder text
        if (!textObj.text || textObj.text === '') {
            textPreview.textContent = 'Empty text';
            textPreview.style.fontStyle = 'italic';
        }
        
        textPreview.addEventListener('focus', (e) => {
            if (e.target.textContent === 'Empty text') {
                e.target.textContent = '';
                e.target.style.fontStyle = 'normal';
            }
        });
    }
    
    // Click to select - use centralized selection system
    textItem.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('asset-btn') && 
            !e.target.classList.contains('asset-item-delete') &&
            !e.target.classList.contains('asset-rename-btn') &&
            !e.target.classList.contains('text-preview-editable')) {
            const { selectElement } = await import('../ui/selection-manager.js');
            selectElement(timelineIndex, 'sidebar', true, e.shiftKey);
        }
    });
    
    return textItem;
}

/**
 * Create asset item element
 */
function createAssetItem(asset) {
    const isLoaded = state.loadedAssets[asset.id];
    const assetItem = createElement('div', {
        classes: ['asset-item', isLoaded ? 'loaded' : ''].filter(Boolean),
        attributes: { 'data-asset-id': asset.id }
    });
    
    const maskIndicator = asset.maskMode ? `
        <div class="asset-mask-indicator" data-asset-id="${asset.id}">
            MASK
            <input type="color" value="${asset.color || '#000000'}" 
                   data-asset-id="${asset.id}" class="mask-color-picker">
        </div>
    ` : '';
    
    let previewContent;
    if (isLoaded) {
        const loadedAsset = state.loadedAssets[asset.id];
        if (loadedAsset instanceof HTMLVideoElement) {
            // Video preview: show first frame
            previewContent = `<video src="${loadedAsset.src}" style="width: 100%; height: 100%; object-fit: cover;" muted></video>${maskIndicator}`;
        } else {
            // Image preview
            previewContent = `<img src="${loadedAsset.src}" alt="${asset.id}">${maskIndicator}`;
        }
    } else {
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        previewContent = `<div class="asset-placeholder">Drop ${mediaType} here<br>or click to load<br><span style="font-size:7px">${asset.filename}</span></div>${maskIndicator}`;
    }
    
    // Type badge
    const typeBadge = asset.type === 'video' ? '🎬 Video' :
                      '🖼️ Image';
    
    // Background toggle for video assets
    const backgroundBtn = (asset.type === 'video' && !asset.isBackground) ? 
        `<button type="button" class="asset-btn" onclick="window.setAsBackground('${asset.id}')" title="Set as background">📺 Background</button>` : '';
    
    const backgroundBadge = asset.isBackground ? 
        `<span style="background: #4CAF50; color: white; padding: 1.4px 4.2px; border-radius: 2.1px; font-size: 7px; margin-left: 3.5px;">BG</span>` : '';
    
    const actionBtn = `
        <div style="display: flex; align-items: center; gap: 2.8px; margin-bottom: 2.8px;">
            <span style="font-size: 7px; color: #888;">${typeBadge}</span>${backgroundBadge}
        </div>
        <button type="button" class="asset-btn" onclick="window.selectAssetFile('${asset.id}')">Load</button>
        ${asset.type === 'image' ? `<button type="button" class="asset-btn" onclick="window.toggleMaskMode('${asset.id}')">${asset.maskMode ? '🎭 Mask' : '🖼️ Image'}</button>` : ''}
        ${backgroundBtn}
    `;
    
    assetItem.innerHTML = `
        <button class="asset-item-delete" onclick="deleteAsset('${asset.id}')" title="Delete asset">×</button>
        <div class="asset-name" ondblclick="renameAsset('${asset.id}')" title="Double-click to rename">
            ${asset.id}
            <button class="asset-rename-btn" onclick="renameAsset('${asset.id}')" title="Rename">✏️</button>
        </div>
        <div class="asset-preview" data-asset-id="${asset.id}">
            ${previewContent}
        </div>
        <div class="asset-actions">
            ${actionBtn}
        </div>
    `;
    
    // Add drag and drop
    const preview = assetItem.querySelector('.asset-preview');
    setupAssetDragDrop(preview, assetItem, asset);
    
    // Add event listener to rename button to prevent propagation
    const renameBtn = assetItem.querySelector('.asset-rename-btn');
    if (renameBtn) {
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Click to select asset in timeline (if it exists)
    assetItem.addEventListener('click', async (e) => {
        // Don't interfere with buttons or other controls
        if (e.target.classList.contains('asset-btn') || 
            e.target.classList.contains('asset-item-delete') ||
            e.target.classList.contains('asset-rename-btn') ||
            e.target.type === 'color') {
            return;
        }
        
        // Find first timeline item using this asset
        const timelineIndex = state.project.timeline.findIndex(item => item.assetId === asset.id);
        if (timelineIndex >= 0) {
            const { selectElement } = await import('../ui/selection-manager.js');
            selectElement(timelineIndex, 'sidebar', true, e.shiftKey);
        }
    });
    
    // Add event listeners to mask indicator to prevent click propagation
    const maskIndicatorEl = assetItem.querySelector('.asset-mask-indicator');
    if (maskIndicatorEl) {
        // Prevent all mouse events from propagating to the preview
        maskIndicatorEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger file chooser
        });
        
        maskIndicatorEl.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Don't trigger file chooser
        });
        
        const colorPicker = maskIndicatorEl.querySelector('.mask-color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't trigger file chooser
            });
            
            colorPicker.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Don't trigger file chooser
            });
            
            colorPicker.addEventListener('change', (e) => {
                e.stopPropagation(); // Don't trigger file chooser
                changeMaskColor(asset.id, e.target.value);
            });
        }
    }
    
    return assetItem;
}

/**
 * Setup global drop zone for adding new assets
 */
function setupGlobalDropZone() {
    const assetList = getById('assetList');
    
    assetList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    assetList.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            await handleNewAssetDrop(files[0]);
        }
    });
}

/**
 * Handle dropping a completely new asset
 */
async function handleNewAssetDrop(file) {
    await handleNewAssetFile(file);
}

/**
 * Handle new asset file (from drop or file picker)
 */
export async function handleNewAssetFile(file) {
    // Prompt for asset ID
    const assetId = prompt('Enter an ID for this asset (e.g., "logo", "character1"):', 
                           file.name.replace(/\.[^/.]+$/, ""));
    
    if (!assetId) return;
    
    // Sanitize ID
    const sanitizedId = assetId.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Check if ID already exists
    if (state.project.assets.find(a => a.id === sanitizedId)) {
        showNotification('Asset ID already exists', 2000, 'error');
        return;
    }
    
    // Determine type (image or video)
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';
    
    // Determine filename (use sanitized ID + original extension)
    const extension = file.name.split('.').pop();
    const filename = `${sanitizedId}.${extension}`;
    
    // Add to project assets
    addAssetToProject(sanitizedId, filename, type);
    
    // Save file
    await saveAssetFile(filename, file);
    
    // Load it
    if (isVideo) {
        await loadAssetVideo(sanitizedId, file);
    } else {
        await loadAssetImage(sanitizedId, file);
    }
    
    // Add to timeline at current time
    const asset = state.project.assets.find(a => a.id === sanitizedId);
    if (asset) {
        const newTimelineItem = {
            type: type,
            assetId: sanitizedId,
            layer: state.project.timeline.length,
            startTime: state.currentTime,
            endTime: state.currentTime + 3,
            position: {
                x: 640,
                y: 360,
                anchorX: 0.5,
                anchorY: 0.5
            },
            size: {
                width: asset.defaultSize.width,
                height: asset.defaultSize.height
            },
            rotation: 0,
            opacity: 1
        };
        
        state.project.timeline.push(newTimelineItem);
        state.selection.element = state.project.timeline.length - 1;
    }
    
    // Update UI
    renderAssetSidebar();
    renderTimeline();
    updateViewport();
    recordChange(`Added ${type}: ${sanitizedId}`);
    queueProjectSave();
    
    showNotification(`✓ Added: ${sanitizedId}`, 2000, 'success');
}

/**
 * Setup drag and drop for asset preview
 */
function setupAssetDragDrop(preview, assetItem, asset) {
    preview.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        assetItem.classList.add('dragover');
    });
    
    preview.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        assetItem.classList.remove('dragover');
    });
    
    preview.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        assetItem.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const isValidMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
            if (isValidMedia) {
                await handleAssetReplace(asset.id, file);
            }
        }
    });
    
    preview.addEventListener('click', () => {
        selectAssetFile(asset.id);
    });
}

/**
 * Handle replacing an existing asset
 */
async function handleAssetReplace(assetId, file) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // Save with the intended filename from JSON
    await saveAssetFile(asset.filename, file);
    
    // Load for display based on asset type
    if (asset.type === 'video') {
        await loadAssetVideo(assetId, file);
    } else {
        await loadAssetImage(assetId, file);
    }
    
    recordChange(`Updated asset: ${assetId}`);
}

/**
 * Select asset file from file picker
 */
export function selectAssetFile(assetId) {
    // Handle "new_asset" case - add completely new asset
    if (assetId === 'new_asset') {
        addNewAssetFromButton();
        return;
    }
    
    const asset = state.project.assets.find(a => a.id === assetId);
    const isVideo = asset && asset.type === 'video';
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = isVideo ? 'video/*' : 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleAssetReplace(assetId, file);
        }
    };
    input.click();
}

/**
 * Add new asset from toolbar button (legacy - now uses placeholder system)
 */
export async function addNewAssetFromButton() {
    if (!state.project) {
        alert('Please open a project first');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleNewAssetFile(file);
        }
    };
    input.click();
}

/**
 * Add placeholder asset without file
 */
export function addPlaceholderAsset(type) {
    if (!state.project) {
        alert('Please open a project first');
        return;
    }
    
    // Prompt for name
    const assetName = prompt(`Enter name for new ${type}:`, '');
    if (assetName === null) return; // User cancelled
    
    // Generate ID from name or use random
    let assetId = assetName.trim();
    if (!assetId) {
        assetId = `${type}_${Date.now()}`;
    } else {
        // Sanitize ID
        assetId = assetId.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    
    // Check if ID already exists
    if (state.project.assets.find(a => a.id === assetId)) {
        showNotification('Asset ID already exists', 2000, 'error');
        return;
    }
    
    // Create placeholder asset
    const placeholderAsset = {
        id: assetId,
        filename: `${assetId}.placeholder`, // Placeholder filename
        type: type === 'mask' ? 'image' : type,
        maskMode: type === 'mask',
        color: type === 'mask' ? '#000000' : undefined,
        defaultSize: {
            width: type === 'video' ? 1280 : 400,
            height: type === 'video' ? 720 : 400
        },
        isPlaceholder: true // Flag to indicate no file yet
    };
    
    // Add to project
    state.project.assets.push(placeholderAsset);
    
    // ONLY add to timeline if it's NOT a background video
    if (!(type === 'video' && placeholderAsset.isBackground)) {
        const newTimelineItem = {
            type: type === 'mask' ? 'image' : type,
            assetId: assetId,
            layer: state.project.timeline.length,
            startTime: state.currentTime,
            endTime: state.currentTime + 3,
            position: {
                x: 640,
                y: 360,
                anchorX: 0.5,
                anchorY: 0.5
            },
            size: {
                width: placeholderAsset.defaultSize.width,
                height: placeholderAsset.defaultSize.height
            },
            rotation: 0,
            opacity: 1
        };
        
        state.project.timeline.push(newTimelineItem);
        state.selection.element = state.project.timeline.length - 1;
    }
    
    // Update UI
    renderAssetSidebar();
    renderTimeline();
    updateViewport();
    recordChange(`Added placeholder ${type}: ${assetId}`);
    queueProjectSave();
    
    showNotification(`✓ Added: ${assetId} (no file yet)`, 2000, 'info');
}

/**
 * Rename asset
 */
export function renameAsset(assetId) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const newName = prompt('Enter new name:', assetId);
    if (newName === null || newName.trim() === '') return;
    
    const newId = newName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Check if new ID already exists
    if (newId !== assetId && state.project.assets.find(a => a.id === newId)) {
        showNotification('Asset ID already exists', 2000, 'error');
        return;
    }
    
    // Update all references in timeline
    state.project.timeline.forEach(item => {
        if (item.assetId === assetId) {
            item.assetId = newId;
        }
    });
    
    // Update in loaded assets
    if (state.loadedAssets[assetId]) {
        state.loadedAssets[newId] = state.loadedAssets[assetId];
        delete state.loadedAssets[assetId];
    }
    
    // Update asset ID
    asset.id = newId;
    
    // Update UI
    renderAssetSidebar();
    renderTimeline();
    recordChange(`Renamed asset: ${assetId} → ${newId}`);
    queueProjectSave();
    
    showNotification(`✓ Renamed to: ${newId}`, 2000, 'success');
}

/**
 * Rename text object
 */
export function renameTextObject(timelineIndex) {
    const textObj = state.project.timeline[timelineIndex];
    if (!textObj || textObj.type !== 'text') return;
    
    const oldId = textObj.assetId || `text_${timelineIndex}`;
    const newName = prompt('Enter new name:', oldId);
    if (newName === null || newName.trim() === '') return;
    
    const newId = newName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Update text object ID
    textObj.assetId = newId;
    
    // Update UI
    renderAssetSidebar();
    renderTimeline();
    recordChange(`Renamed text: ${oldId} → ${newId}`);
    queueProjectSave();
    
    showNotification(`✓ Renamed to: ${newId}`, 2000, 'success');
}

/**
 * Update text content from sidebar quick edit
 */
export function updateTextContent(timelineIndex, newText) {
    const textObj = state.project.timeline[timelineIndex];
    if (!textObj || textObj.type !== 'text') return;
    
    // Update the text content
    textObj.text = newText;
    
    // Save and update viewport
    updateViewport();
    recordChange(`Edited text content: ${textObj.assetId || 'text_' + timelineIndex}`);
    queueProjectSave();
    
    console.log(`Updated text content at index ${timelineIndex}`);
}

/**
 * Load asset image from file
 */
export async function loadAssetImage(assetId, file) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (asset.maskMode) {
                state.loadedAssets[assetId] = createColoredMask(img, asset.color || '#000000');
            } else {
                state.loadedAssets[assetId] = img;
            }
            
            renderAssetSidebar();
            updateViewport();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Load asset video from file
 */
export async function loadAssetVideo(assetId, file) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        
        // Set loop if specified
        if (asset.loop || asset.isBackground) {
            video.loop = true;
        }
        
        video.onloadedmetadata = () => {
            state.loadedAssets[assetId] = video;
            renderAssetSidebar();
            updateViewport();
        };
    };
    reader.readAsDataURL(file);
}

/**
 * Create colored mask from grayscale image
 */
export function createColoredMask(maskImage, color) {
    const canvas = document.createElement('canvas');
    canvas.width = maskImage.width;
    canvas.height = maskImage.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(maskImage, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const { r, g, b } = hexToRgb(color);
    
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = brightness;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Cut out bottom-right 8% square (remove watermark area)
    ctx.globalCompositeOperation = 'destination-out';
    const cutoutSize = canvas.width * 0.08;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(
        canvas.width - cutoutSize,
        canvas.height - cutoutSize,
        cutoutSize,
        cutoutSize
    );
    
    const resultImg = new Image();
    resultImg.src = canvas.toDataURL();
    resultImg._originalMask = maskImage;
    
    return resultImg;
}

/**
 * Toggle mask mode for asset
 */
export function toggleMaskMode(assetId) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    asset.maskMode = !asset.maskMode;
    if (asset.maskMode && !asset.color) {
        asset.color = '#000000';
    }
    
    // Reload asset with new mode
    if (state.loadedAssets[assetId]) {
        const currentImg = state.loadedAssets[assetId];
        const originalImg = currentImg._originalMask || currentImg;
        
        if (asset.maskMode) {
            state.loadedAssets[assetId] = createColoredMask(originalImg, asset.color);
        } else {
            state.loadedAssets[assetId] = originalImg;
        }
    }
    
    recordChange(`Toggled mask mode: ${assetId}`);
    queueProjectSave();
    renderAssetSidebar();
    updateViewport();
}

/**
 * Set video asset as background
 */
export function setAsBackground(assetId) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset || asset.type !== 'video') return;
    
    // Clear previous background
    state.project.assets.forEach(a => {
        if (a.id !== assetId && a.isBackground) {
            delete a.isBackground;
        }
    });
    
    // Set as background
    asset.isBackground = true;
    asset.loop = true; // Background videos should loop
    
    // REMOVE all timeline items associated with this asset
    state.project.timeline = state.project.timeline.filter(item => item.assetId !== assetId);

    // Reload video with new settings
    if (state.loadedAssets[assetId]) {
        state.loadedAssets[assetId].loop = true;
    }
    
    recordChange(`Set as background: ${assetId}`);
    queueProjectSave();
    renderAssetSidebar();
    renderTimeline(); // Re-render timeline to remove deleted blocks
    updateViewport();
}

/**
 * Change mask color
 * Applies to all selected masks in multi-selection
 */
export function changeMaskColor(assetId, newColor) {
    const asset = state.project.assets.find(a => a.id === assetId);
    if (!asset || !asset.maskMode) return;
    
    // Collect all mask asset IDs from selected elements
    const maskAssetIds = new Set([assetId]); // Start with the clicked one
    
    if (state.selection.elements && state.selection.elements.length > 1) {
        // In multi-selection: apply to all selected masks
        state.selection.elements.forEach(timelineIndex => {
            const item = state.project.timeline[timelineIndex];
            if (item && item.assetId) {
                const itemAsset = state.project.assets.find(a => a.id === item.assetId);
                if (itemAsset && itemAsset.maskMode) {
                    maskAssetIds.add(item.assetId);
                }
            }
        });
    }
    
    // Apply color to all collected masks
    let changeCount = 0;
    maskAssetIds.forEach(maskId => {
        const maskAsset = state.project.assets.find(a => a.id === maskId);
        if (maskAsset && maskAsset.maskMode) {
            maskAsset.color = newColor;
            
            if (state.loadedAssets[maskId] && state.loadedAssets[maskId]._originalMask) {
                state.loadedAssets[maskId] = createColoredMask(
                    state.loadedAssets[maskId]._originalMask, 
            newColor
        );
                changeCount++;
            }
        }
    });
    
    if (changeCount > 0) {
        renderAssetSidebar();
        updateViewport();
        const msg = changeCount > 1 ? `Changed ${changeCount} mask colors` : `Changed mask color: ${assetId}`;
        recordChange(msg);
        queueProjectSave();
    }
}

/**
 * Load all project assets from filesystem
 */
export async function loadProjectAssets() {
    if (!state.project || !state.project.assets) return;
    
    for (const asset of state.project.assets) {
        try {
            const file = await readAssetFile(asset.filename);
            if (file) {
                // Load based on asset type
                if (asset.type === 'video') {
                    await loadAssetVideo(asset.id, file);
                } else {
                    await loadAssetImage(asset.id, file);
                }
            }
        } catch (err) {
            console.warn(`Failed to load asset: ${asset.filename}`);
        }
    }
    
    renderAssetSidebar();
    updateViewport();
}

/**
 * Delete asset from project
 */
export function deleteAsset(assetId, skipConfirmation = false) {
    if (!skipConfirmation && !confirm(`Delete asset "${assetId}"? This will remove it from all timeline items.`)) return;
    
    // Remove from assets array
    const assetIndex = state.project.assets.findIndex(a => a.id === assetId);
    if (assetIndex >= 0) {
        state.project.assets.splice(assetIndex, 1);
    }
    
    // Remove from loaded assets
    delete state.loadedAssets[assetId];
    
    // Remove all timeline items using this asset
    state.project.timeline = state.project.timeline.filter(item => item.assetId !== assetId);
    
    recordChange(`Deleted asset: ${assetId}`);
    queueProjectSave();
    renderAssetSidebar();
    renderTimeline(); // Added to ensure timeline updates after asset deletion
    updateViewport();
}

/**
 * Delete timeline item (text object or media)
 */
export function deleteTimelineItem(timelineIndex) {
    if (!state.project || !state.project.timeline[timelineIndex]) return;
    
    const item = state.project.timeline[timelineIndex];
    const itemName = item.assetId || `text_${timelineIndex}`;
    
    if (!confirm(`Delete "${itemName}"?`)) return;
    
    // Store assetId if it's a media asset before splicing
    const deletedAssetId = item.assetId;
    
    // Remove from timeline
    state.project.timeline.splice(timelineIndex, 1);

    // If the deleted item was selected, clear selection and update panels
    if (state.selection.element === timelineIndex) {
        // Clear selection data directly first
        state.selection.element = null;
        state.selection.elements = [];
        state.selection.block = null;
        state.selection.keyframe = null;

        // Update floating panel visibility (will hide panels if nothing is selected)
        import('../animation/animation-panel.js').then(({ updateFloatingPanelVisibility }) => {
            updateFloatingPanelVisibility();
        });

        // Clear sidebar highlights and trigger viewport/timeline updates (redundant but safe for now)
        import('../ui/selection-manager.js').then(({ clearSelection }) => {
            clearSelection();
        });
    }

    // If it was a media asset, check if this was its last instance in the timeline.
    // If so, delete the asset definition itself.
    if (deletedAssetId && item.type !== 'text') { // Ensure it's not a text type and has an assetId
        const remainingInstances = state.project.timeline.some(timelineItem => 
            timelineItem.assetId === deletedAssetId
        );
        if (!remainingInstances) {
            // Pass true to skip confirmation for internal deletion
            deleteAsset(deletedAssetId, true); 
        }
    }
    
    recordChange(`Deleted timeline item: ${itemName}`);
    queueProjectSave();

    // ALWAYS update all UI components after deletion
    renderAssetSidebar();
    updateViewport();
    renderTimeline();
}

/**
 * Seek timeline to show a specific timeline item
 */
export function seekToTimelineItem(timelineIndex) {
    if (!state.project || !state.project.timeline[timelineIndex]) return;
    
    const item = state.project.timeline[timelineIndex];
    state.currentTime = item.startTime;
    state.selection.element = timelineIndex;
    
    updateViewport();
    
    // Update timeline UI
    renderTimeline();
}

// Expose functions to window for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.selectAssetFile = selectAssetFile;
    window.changeMaskColor = changeMaskColor;
    window.toggleMaskMode = toggleMaskMode;
    window.setAsBackground = setAsBackground;
    window.deleteAsset = deleteAsset;
    window.deleteTimelineItem = deleteTimelineItem;
    window.seekToTimelineItem = seekToTimelineItem;
    window.addPlaceholderAsset = addPlaceholderAsset;
    window.renameAsset = renameAsset;
    window.renameTextObject = renameTextObject;
    window.updateTextContent = updateTextContent;
}

