/* ============================================
   MAIN V2 - Application Entry Point (Filesystem Version)
   ============================================ */

import { state } from './state/state.js';
import { DEFAULT_TEXT_STYLE } from './state/constants.js';
import { isFileSystemSupported } from './api/filesystem.js';
import { 
    openProjectFolder,
    autoRestoreProject,
    reloadProject
} from './core/project-v2.js';
import { animate, togglePlayback } from './core/playback.js';
import { undo, redo, saveWithHistory } from './core/history.js';
import { setupTimelineInteraction } from './timeline/timeline-interaction.js';
import { setupTimelineResize } from './timeline/timeline-resize.js';
import { setupFloatingToolbarPosition } from './ui/floating-toolbar-position.js';
import { duplicateSelectedElement } from './core/duplicate.js';
import { renderHistoryPanel } from './ui/history-panel.js';
import { getById } from './utils/dom.js';
import { createDebugPanel, debugLog } from './utils/debug-logger.js';
import './text/text-editor.js'; // Import text editor for side effects (window exposure)
import './text/text-utils.js'; // Import text utils for side effects (window exposure)
import './export/video-export.js'; // Import video export for side effects (window exposure)
import './ui/selection-manager.js'; // Import selection manager for side effects (window exposure)
import './animation/animation-panel.js'; // Import animation panel for side effects (window exposure)
import { 
    setFPS, 
    goToFrame, 
    previousFrame, 
    nextFrame, 
    goToTimecode, 
    updateFrameDisplay,
    initializeFPSSelector 
} from './timeline/frame-navigation.js';
import { updateViewport } from './viewport/viewport.js'; // Add this import

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl+Z - Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            renderHistoryPanel();
        }
        
        // Ctrl+Y or Ctrl+Shift+Z - Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
            renderHistoryPanel();
        }
        
        // Ctrl+S - Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveWithHistory();
            renderHistoryPanel();
        }
        
        // Ctrl+D - Duplicate selected element
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            duplicateSelectedElement();
            renderHistoryPanel();
        }
        
        // Spacebar - Play/Pause
        if (e.key === ' ') {
            e.preventDefault();
            togglePlayback();
        }
        
        // Delete - Delete selected element
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selection.element !== null) {
                e.preventDefault();
                
                const selectedItem = state.project.timeline[state.selection.element];
                if (!selectedItem) return;

                import('./core/assets-v2.js').then(({ deleteTimelineItem, deleteAsset }) => {
                    if (selectedItem.type === 'text') {
                        // For text, delete only the timeline item (which is its sole representation)
                        deleteTimelineItem(state.selection.element);
                    } else if (selectedItem.assetId) {
                        // For media assets, delete the entire asset and its timeline instances
                        deleteAsset(selectedItem.assetId);
                    }
                });
            }
        }
        
        // Escape - Close panels / Deselect / Exit fullscreen
        if (e.key === 'Escape') {
            // Exit fullscreen first if active
            const viewport = getById('viewport');
            if (viewport && viewport.classList.contains('fullscreen')) {
                viewport.classList.remove('fullscreen');
                return;
            }
            
            // Close any open floating panels
            if (typeof window.closeAllFloatingPanels === 'function') {
                window.closeAllFloatingPanels();
            }
            
            // Deselect using unified system
            if (typeof window.clearSelection === 'function') {
                window.clearSelection();
            }
        }
    });
}

/**
 * Setup topbar deselection behavior
 */
function setupTopbarDeselection() {
    const topBar = getById('topBar');
    if (!topBar) return;
    
    topBar.addEventListener('click', async (e) => {
        // Only deselect if clicking directly on the topbar (not on buttons or spans)
        if (e.target === topBar) {
            const { clearSelection } = await import('./ui/selection-manager.js');
            clearSelection();
        }
    });
}

/**
 * Initialize application
 */
async function init() {
    console.log('🚀 Auto Explainer Tool v2 - Initializing...');
    
    // Check File System API support
    if (!isFileSystemSupported()) {
        alert('⚠️ Your browser doesn\'t support the File System Access API.\n\nPlease use Chrome, Edge, or Opera for this version.');
        return;
    }
    
    console.log('✅ File System Access API supported');
    
    // Setup interactions
    setupTimelineInteraction();
    setupTimelineResize();
    setupFloatingToolbarPosition();
    setupKeyboardShortcuts();
    setupTopbarDeselection();
    
    // Setup play button
    const playBtn = getById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }
    
    // Setup window resize handler to update viewport scale
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            import('./viewport/viewport.js').then(({ updateViewport }) => {
                updateViewport();
            });
        }, 100); // Debounce resize events
    });
    
    // Listen for fullscreen changes (when user exits via ESC or browser controls)
    document.addEventListener('fullscreenchange', () => {
        const viewport = getById('viewport');
        if (!document.fullscreenElement && viewport.classList.contains('fullscreen')) {
            viewport.classList.remove('fullscreen');
            setTimeout(() => {
                import('./viewport/viewport.js').then(({ updateViewport }) => {
                    updateViewport();
                });
            }, 100);
        }
    });
    
    // Initialize FPS selector
    initializeFPSSelector();
    
    // Try to auto-restore last project
    const restored = await autoRestoreProject();
    
    if (!restored) {
        // Show instruction if no project was restored
        const folderName = getById('projectFolderName');
        if (folderName) {
            folderName.textContent = '👈 Click "Open Folder" to start';
            folderName.style.color = '#FFD700';
        }
    } else {
        // Update frame display after project is restored
        updateFrameDisplay();
    }
    
    // Start animation loop (if not already running)
    if (!state.animationFrameId) {
        state.animationFrameId = requestAnimationFrame(animate);
    }
    
    // Add window resize listener for responsive updates
    window.addEventListener('resize', updateViewport);

    // Create debug panel (hidden by default - toggle with toggleDebugPanel() in console)
    createDebugPanel();
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) debugPanel.style.display = 'none';
    debugLog('✅ App initialized', { version: 'v2' });
    
    console.log('✅ Initialization complete');
    console.log('💡 Debug panel available: Call toggleDebugPanel() in console to show/hide');
}

// Expose functions to window for HTML onclick handlers (must be done before DOM loads)
window.openProjectFolder = openProjectFolder;
window.reloadProject = reloadProject;
window.saveProject = saveWithHistory;
window.undo = undo;
window.redo = redo;
window.togglePlayback = togglePlayback;

// Frame navigation functions
window.setFPS = setFPS;
window.goToFrame = goToFrame;
window.previousFrame = previousFrame;
window.nextFrame = nextFrame;
window.goToTimecode = goToTimecode;
window.updateFrameDisplay = updateFrameDisplay;
window.toggleHistoryPanel = async () => {
    const { toggleHistoryPanel } = await import('./ui/history-panel.js');
    toggleHistoryPanel();
};
window.openAnimationPanel = async () => {
    const { openAnimationPanel } = await import('./animation/animation-panel.js');
    openAnimationPanel();
};
window.closeAnimationPanel = async () => {
    const { closeAnimationPanel } = await import('./animation/animation-panel.js');
    closeAnimationPanel();
};
window.updateElementAnimation = async (inOut, property, value) => {
    const { updateElementAnimation } = await import('./animation/animation-panel.js');
    updateElementAnimation(inOut, property, value);
};
window.insertKeyframe = async (property) => {
    const { insertKeyframe } = await import('./keyframes/keyframe-ui.js');
    insertKeyframe(property);
};

// Fullscreen toggle
window.toggleViewportFullscreen = async () => {
    const viewport = getById('viewport');
    const isFullscreen = viewport.classList.contains('fullscreen');
    
    if (isFullscreen) {
        viewport.classList.remove('fullscreen');
        // Exit native fullscreen if active
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (err) {
                console.log('Fullscreen exit failed:', err);
            }
        }
    } else {
        viewport.classList.add('fullscreen');
        // Try to use native fullscreen API for better experience
        if (viewport.requestFullscreen) {
            try {
                await viewport.requestFullscreen();
            } catch (err) {
                console.log('Native fullscreen not available, using CSS fullscreen');
            }
        }
    }
    
    // Update viewport after fullscreen change
    setTimeout(() => {
        import('./viewport/viewport.js').then(({ updateViewport }) => {
            updateViewport();
        });
    }, 100);
};

// ESC key handling is now in setupKeyboardShortcuts()

// Text editor functions
window.openTextEditor = (timelineIndex) => {
    if (!state.project || timelineIndex === null || timelineIndex === undefined) return;
    
    const item = state.project.timeline[timelineIndex];
    if (!item || item.type !== 'text') return;
    
    // Check if multiple texts are selected
    const textIndices = state.selection.elements.filter(idx => {
        const textItem = state.project.timeline[idx];
        return textItem && textItem.type === 'text';
    });
    
    const hasMultiple = textIndices.length > 1;
    
    // Update multi-label
    const multiLabel = getById('textEditorPanelMultiLabel');
    if (multiLabel) {
        if (hasMultiple) {
            multiLabel.textContent = `(Editing ${textIndices.length} texts)`;
        } else {
            multiLabel.textContent = '';
        }
    }
    
    // Populate form with primary selected item's values
    const textContentField = getById('textContent');
    const multiEditNote = getById('textMultiEditNote');
    
    if (hasMultiple) {
        // Disable and hide content field for multi-edit (formatting only)
        textContentField.value = '';
        textContentField.disabled = true;
        textContentField.style.display = 'none';
        textContentField.placeholder = '';
        // Show multi-edit note
        if (multiEditNote) multiEditNote.style.display = 'block';
    } else {
        // Enable and show content field for single edit
        textContentField.value = item.text || '';
        textContentField.disabled = false;
        textContentField.style.display = 'block';
        textContentField.placeholder = 'Enter your text...';
        // Hide multi-edit note
        if (multiEditNote) multiEditNote.style.display = 'none';
    }
    
    getById('textFontFamily').value = item.style?.fontFamily || DEFAULT_TEXT_STYLE.fontFamily;
    getById('textFontSize').value = item.style?.fontSize || DEFAULT_TEXT_STYLE.fontSize;
    getById('textFontWeight').value = item.style?.fontWeight || DEFAULT_TEXT_STYLE.fontWeight;
    getById('textFontStyle').value = item.style?.fontStyle || DEFAULT_TEXT_STYLE.fontStyle;
    getById('textColor').value = item.style?.color || DEFAULT_TEXT_STYLE.color;
    getById('textBackgroundColor').value = item.style?.backgroundColor || DEFAULT_TEXT_STYLE.backgroundColor;
    getById('textAlign').value = item.style?.textAlign || DEFAULT_TEXT_STYLE.textAlign;
    getById('textDecoration').value = item.style?.textDecoration || DEFAULT_TEXT_STYLE.textDecoration;
    getById('textLineHeight').value = item.style?.lineHeight || DEFAULT_TEXT_STYLE.lineHeight;
    getById('textLetterSpacing').value = item.style?.letterSpacing || DEFAULT_TEXT_STYLE.letterSpacing;
    getById('textPadding').value = item.style?.padding || DEFAULT_TEXT_STYLE.padding;
    getById('textBorderRadius').value = item.style?.borderRadius || DEFAULT_TEXT_STYLE.borderRadius;
    
    // Open the panel
    import('./animation/animation-panel.js').then(({ toggleFloatingPanel }) => {
        toggleFloatingPanel('textEditor');
    });
};

window.closeTextEditor = () => {
    import('./animation/animation-panel.js').then(({ closeAllFloatingPanels }) => {
        closeAllFloatingPanels();
    });
};

window.saveTextChanges = () => {
    if (!state.project || !state.selection.elements || state.selection.elements.length === 0) return;
    
    // Collect text elements from selection
    const textIndices = state.selection.elements.filter(idx => {
        const item = state.project.timeline[idx];
        return item && item.type === 'text';
    });
    
    if (textIndices.length === 0) return;
    
    // Get values from form
    const updates = {
        text: getById('textContent').value,
        style: {
            fontFamily: getById('textFontFamily').value,
            fontSize: parseFloat(getById('textFontSize').value),
            fontWeight: getById('textFontWeight').value,
            fontStyle: getById('textFontStyle').value,
            color: getById('textColor').value,
            backgroundColor: getById('textBackgroundColor').value,
            textAlign: getById('textAlign').value,
            textDecoration: getById('textDecoration').value,
            lineHeight: parseFloat(getById('textLineHeight').value),
            letterSpacing: parseFloat(getById('textLetterSpacing').value),
            padding: parseFloat(getById('textPadding').value),
            borderRadius: parseFloat(getById('textBorderRadius').value)
        }
    };
    
    // Apply to all selected text elements
    textIndices.forEach(idx => {
        const item = state.project.timeline[idx];
        if (item && item.type === 'text') {
            // Update text (only for single selection)
            if (textIndices.length === 1) {
                item.text = updates.text;
            }
            
            // Update style (always)
            if (!item.style) item.style = {};
            Object.assign(item.style, updates.style);
            
            // Recalculate dimensions
            import('./text/text-renderer.js').then(({ calculateTextDimensions }) => {
                const dims = calculateTextDimensions(item.text, item.style);
                item.size.width = dims.width;
                item.size.height = dims.height;
                
                import('./viewport/viewport.js').then(({ updateViewport }) => {
                    updateViewport();
                });
            });
        }
    });
    
    // Record change
    import('./core/history.js').then(({ recordChange }) => {
        const msg = textIndices.length > 1 
            ? `Edited ${textIndices.length} text elements` 
            : 'Edited text element';
        recordChange(msg);
    });
    
    // Update UI
    import('./timeline/timeline.js').then(({ renderTimeline }) => {
        renderTimeline();
    });
    import('./core/assets-v2.js').then(({ renderAssetSidebar }) => {
        renderAssetSidebar();
    });
    import('./core/project-v2.js').then(({ queueProjectSave }) => {
        queueProjectSave();
    });
    
    // Close editor
    window.closeTextEditor();
};

window.populateTextEditorIfNeeded = () => {
    if (state.selection.element !== null) {
        const item = state.project.timeline[state.selection.element];
        if (item && item.type === 'text') {
            window.openTextEditor(state.selection.element);
        }
    }
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

