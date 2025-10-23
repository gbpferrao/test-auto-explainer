/* ============================================
   DUPLICATE - Clone timeline elements
   ============================================ */

import { state } from '../state/state.js';
import { queueProjectSave } from './project-v2.js';
import { recordChange } from './history.js';
import { selectElement } from '../ui/selection-manager.js';
import { updateViewport } from '../viewport/viewport.js';
import { renderTimeline } from '../timeline/timeline.js';
import { renderAssetSidebar } from './assets-v2.js';

const POSITION_OFFSET = 20; // px offset for duplicated elements

/**
 * Duplicate the currently selected timeline element
 */
export function duplicateSelectedElement() {
    if (!state.project || state.selection.element === null) {
        console.log('No element selected to duplicate');
        return;
    }
    
    const originalIndex = state.selection.element;
    const original = state.project.timeline[originalIndex];
    
    if (!original) {
        console.warn('Selected element not found');
        return;
    }
    
    // Create a deep copy of the original
    const duplicate = JSON.parse(JSON.stringify(original));
    
    // Offset base position for visual distinction
    duplicate.position.x += POSITION_OFFSET;
    duplicate.position.y += POSITION_OFFSET;
    
    // Keep same timeline timing (no time offset)
    // duplicate.startTime and duplicate.endTime stay the same
    
    // Offset position keyframes if they exist (delta all position values)
    if (duplicate.keyframes && duplicate.keyframes.position) {
        duplicate.keyframes.position.forEach(kf => {
            kf.value.x += POSITION_OFFSET;
            kf.value.y += POSITION_OFFSET;
        });
    }
    
    // Other keyframes (size, rotation, opacity) keep their original values and times
    // No time offset needed - duplicate appears at the exact same timeline position
    
    // Add to timeline
    state.project.timeline.push(duplicate);
    const newIndex = state.project.timeline.length - 1;
    
    // Record change
    const assetName = original.assetId || (original.type === 'text' ? 'text' : 'element');
    recordChange(`Duplicated ${assetName}`);
    
    // Save project
    queueProjectSave();
    
    // Update UI
    renderTimeline();
    renderAssetSidebar();
    updateViewport();
    
    // Select the new duplicate
    selectElement(newIndex, 'viewport', true);
    
    console.log(`Duplicated element: ${assetName} (index ${originalIndex} -> ${newIndex})`);
}

