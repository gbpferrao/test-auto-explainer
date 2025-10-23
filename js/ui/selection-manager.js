/* ============================================
   SELECTION MANAGER - Unified Selection Across UI
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { updateViewport } from '../viewport/viewport.js';
import { renderTimeline } from '../timeline/timeline.js';
import { updatePlayhead } from '../timeline/playhead.js';
import { renderAssetSidebar } from '../core/assets-v2.js';

/**
 * Select an element and sync across all UI components
 * @param {number} timelineIndex - Index in timeline array
 * @param {string} source - Where selection originated ('viewport', 'timeline', 'sidebar')
 * @param {boolean} seekToStart - Whether to seek to element's start time
 * @param {boolean} addToSelection - Add to existing selection (multi-select)
 */
export function selectElement(timelineIndex, source = 'viewport', seekToStart = true, addToSelection = false) {
    if (!state.project || timelineIndex === null || timelineIndex === undefined) {
        if (!addToSelection) clearSelection();
        return;
    }
    
    const item = state.project.timeline[timelineIndex];
    if (!item) {
        if (!addToSelection) clearSelection();
        return;
    }
    
    // Update selection state
    if (addToSelection) {
        // Add to multi-selection
        if (!state.selection.elements.includes(timelineIndex)) {
            state.selection.elements.push(timelineIndex);
        }
        state.selection.element = timelineIndex; // Set as primary
    } else {
        // Single selection
        state.selection.element = timelineIndex;
        state.selection.elements = [timelineIndex];
    }
    state.selection.block = timelineIndex;
    
    // Seek to element's start time if requested
    if (seekToStart && state.currentTime < item.startTime || state.currentTime > item.endTime) {
        state.currentTime = item.startTime;
        updatePlayhead();
    }
    
    // Update floating panel visibility
    if (typeof window !== 'undefined' && window.updateFloatingPanelVisibility) {
        window.updateFloatingPanelVisibility();
    }
    
    // Update all UI components based on source
    if (source !== 'viewport') {
        updateViewport();
    }
    
    // Always update timeline highlights (even when clicking from timeline)
    highlightTimelineBlock(timelineIndex);
    
    // Always update sidebar highlights
    if (state.selection.elements.length === 1) {
        // Single selection - scroll to it if not from sidebar
        highlightAndScrollSidebar(timelineIndex, source === 'sidebar');
    } else {
        // Multi-selection: just highlight, no scroll
        highlightSidebarMultiple(state.selection.elements);
    }
    
    const count = state.selection.elements.length;
    if (count > 1) {
        console.log(`Selected ${count} elements from ${source}`);
    } else {
        console.log(`Selected element ${timelineIndex} (${item.assetId || 'text'}) from ${source}`);
    }
}

/**
 * Select multiple elements
 * @param {number[]} indices - Array of timeline indices
 * @param {string} source - Where selection originated
 */
export function selectMultipleElements(indices, source = 'viewport') {
    if (!state.project || !indices || indices.length === 0) {
        clearSelection();
        return;
    }
    
    // Filter valid indices
    const validIndices = indices.filter(i => 
        i >= 0 && i < state.project.timeline.length
    );
    
    if (validIndices.length === 0) {
        clearSelection();
        return;
    }
    
    // Update selection state
    state.selection.elements = validIndices;
    state.selection.element = validIndices[0]; // First as primary
    state.selection.block = validIndices[0];
    
    // Update UI
    if (source !== 'viewport') {
        updateViewport();
    }
    
    // Always update timeline (even when clicking from timeline)
    renderTimeline();
    
    // Always update sidebar
    highlightSidebarMultiple(validIndices);
    
    // Update floating panels
    if (typeof window !== 'undefined' && window.updateFloatingPanelVisibility) {
        window.updateFloatingPanelVisibility();
    }
    
    console.log(`Selected ${validIndices.length} elements from ${source}`);
}

/**
 * Clear all selections and update all UI
 */
export function clearSelection() {
    state.selection.element = null;
    state.selection.elements = [];
    state.selection.block = null;
    state.selection.keyframe = null;
    
    // Clear sidebar highlights
    const assetList = getById('assetList');
    if (assetList) {
        assetList.querySelectorAll('.asset-item').forEach(el => {
            el.classList.remove('selected-item');
        });
    }
    
    // Hide floating panels
    if (typeof window !== 'undefined' && window.updateFloatingPanelVisibility) {
        window.updateFloatingPanelVisibility();
    }
    
    updateViewport();
    renderTimeline();
    
    console.log('Selection cleared');
}

/**
 * Highlight timeline block
 */
function highlightTimelineBlock(timelineIndex) {
    renderTimeline();
    
    // Scroll timeline to show block if needed
    const tracks = getById('timelineTracks');
    if (!tracks) return;
    
    const block = tracks.querySelector(`[data-block-index="${timelineIndex}"]`);
    if (!block) return;
    
    const container = getById('timelineContainer');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    
    // Check if block is visible horizontally
    if (blockRect.left < containerRect.left || blockRect.right > containerRect.right) {
        // Scroll to show block
        const item = state.project.timeline[timelineIndex];
        const targetX = item.startTime * state.timeline.zoom;
        state.timeline.panX = -targetX + 100; // Offset by 100px from left
        renderTimeline();
    }
}

/**
 * Highlight and scroll sidebar to show selected element
 * @param {number} timelineIndex - The timeline index to highlight
 * @param {boolean} skipScroll - If true, don't scroll (used when clicking from sidebar itself)
 */
function highlightAndScrollSidebar(timelineIndex, skipScroll = false) {
    const item = state.project.timeline[timelineIndex];
    if (!item) return;
    
    const sidebar = getById('assetSidebar');
    const assetList = getById('assetList');
    if (!sidebar || !assetList) return;
    
    // Remove previous highlights
    assetList.querySelectorAll('.asset-item').forEach(el => {
        el.classList.remove('selected-item');
    });
    
    // Find and highlight the corresponding item
    let targetElement = null;
    
    if (item.type === 'text') {
        // Text object - find by timeline index
        targetElement = assetList.querySelector(`[data-timeline-index="${timelineIndex}"]`);
    } else {
        // Asset - find by asset ID
        targetElement = assetList.querySelector(`[data-asset-id="${item.assetId}"]`);
    }
    
    if (targetElement) {
        targetElement.classList.add('selected-item');
        
        // Scroll to show element (unless skipScroll is true)
        if (!skipScroll) {
            const sidebarRect = sidebar.getBoundingClientRect();
            const elementRect = targetElement.getBoundingClientRect();
            
            // Check if element is visible
            const isAbove = elementRect.top < sidebarRect.top;
            const isBelow = elementRect.bottom > sidebarRect.bottom;
            
            if (isAbove || isBelow) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    }
}

/**
 * Handle sidebar item click
 */
export function handleSidebarItemClick(timelineIndex) {
    selectElement(timelineIndex, 'sidebar', true);
}

/**
 * Highlight multiple sidebar items (no scroll)
 */
function highlightSidebarMultiple(indices) {
    const assetList = getById('assetList');
    if (!assetList) return;
    
    // Clear all highlights
    assetList.querySelectorAll('.asset-item').forEach(el => {
        el.classList.remove('selected-item');
    });
    
    // Highlight all selected items
    indices.forEach(timelineIndex => {
        const item = state.project.timeline[timelineIndex];
        if (!item) return;
        
        let targetElement = null;
        
        if (item.type === 'text') {
            targetElement = assetList.querySelector(`[data-timeline-index="${timelineIndex}"]`);
        } else {
            targetElement = assetList.querySelector(`[data-asset-id="${item.assetId}"]`);
        }
        
        if (targetElement) {
            targetElement.classList.add('selected-item');
        }
    });
}

/**
 * Check if an element is selected (in multi-selection)
 */
export function isElementSelected(timelineIndex) {
    return state.selection.elements.includes(timelineIndex);
}

/**
 * Get all selected element indices
 */
export function getSelectedElements() {
    return state.selection.elements || [];
}

/**
 * Expose to window for easy access
 */
if (typeof window !== 'undefined') {
    window.selectElement = selectElement;
    window.selectMultipleElements = selectMultipleElements;
    window.clearSelection = clearSelection;
    window.isElementSelected = isElementSelected;
    window.getSelectedElements = getSelectedElements;
}

