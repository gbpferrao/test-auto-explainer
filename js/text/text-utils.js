/* ============================================
   TEXT UTILS - Helper functions for text objects
   ============================================ */

import { state } from '../state/state.js';
import { DEFAULT_TEXT_STYLE } from '../state/constants.js';
import { updateViewport } from '../viewport/viewport.js';
import { renderTimeline } from '../timeline/timeline.js';
import { queueProjectSave } from '../core/project-v2.js';
import { recordChange } from '../core/history.js';
import { calculateTextDimensions } from './text-renderer.js';
import { renderAssetSidebar } from '../core/assets-v2.js';

/**
 * Add a new text object to timeline
 */
export function addTextObject() {
    if (!state.project) {
        alert('Please open a project first');
        return;
    }
    
    const textId = `text_${Date.now()}`;
    const textContent = 'Enter your text here';
    const style = { ...DEFAULT_TEXT_STYLE };
    
    // Calculate dimensions
    const dims = calculateTextDimensions(textContent, style);
    
    const newTextItem = {
        type: 'text',
        assetId: textId,
        text: textContent,
        style: style,
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
            width: dims.width,
            height: dims.height
        },
        rotation: 0,
        opacity: 1.0
    };
    
    state.project.timeline.push(newTextItem);
    
    // Record change
    recordChange(`Added text: ${textId}`);
    
    // Update UI
    renderAssetSidebar();  // ← Add this to show text in sidebar immediately
    renderTimeline();
    updateViewport();
    queueProjectSave();
    
    // Select and open editor
    state.selection.element = state.project.timeline.length - 1;
    updateViewport();
    
    // Open text editor
    setTimeout(() => {
        window.openTextEditor(state.project.timeline.length - 1);
    }, 100);
}

// Expose to window
if (typeof window !== 'undefined') {
    window.addTextObject = addTextObject;
}

