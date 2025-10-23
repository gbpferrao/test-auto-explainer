/* ============================================
   KEYFRAME UI - Render indicators & panels
   ============================================ */

import { state } from '../state/state.js';
import { getById, createElement } from '../utils/dom.js';
import { applyKeyframes } from './keyframe-system.js';
import { renderTimeline } from '../timeline/timeline.js';
import { updateViewport } from '../viewport/viewport.js';
import { queueProjectSave } from '../core/project-v2.js';
import { updatePlayhead } from '../timeline/playhead.js';
import { snapToFrame } from '../utils/time-utils.js';

/**
 * Render keyframe indicators on timeline
 */
export function renderKeyframeIndicators() {
    if (!state.project) return;
    
    const tracks = getById('timelineTracks');
    
    // Remove existing overlays
    const existingOverlays = tracks.querySelectorAll('.keyframe-track-overlay');
    existingOverlays.forEach(el => el.remove());
    
    // Group by assetId
    const assetGroups = {};
    state.project.timeline.forEach((item, index) => {
        if (!assetGroups[item.assetId]) {
            assetGroups[item.assetId] = [];
        }
        assetGroups[item.assetId].push({ item, originalIndex: index });
    });
    
    // Render indicators for each track
    Object.keys(assetGroups).forEach((assetId, trackIndex) => {
        const track = tracks.children[trackIndex];
        if (!track) return;
        
        const overlay = createElement('div', { classes: 'keyframe-track-overlay' });
        
        assetGroups[assetId].forEach(({ item, originalIndex }) => {
            if (!item.keyframes) return;
            
            // Get the sub-lane offset from the timeline block
            const block = track.querySelector(`[data-block-index="${originalIndex}"]`);
            const subLane = block ? parseInt(block.dataset.subLane || '0') : 0;
            
            // Calculate vertical offset for this sub-lane
            const baseHeight = 28;
            const verticalPadding = 7;
            const subLaneSpacing = 4;
            const subLaneOffset = subLane * (baseHeight + subLaneSpacing);
            
            const properties = ['position', 'size', 'rotation', 'opacity'];
            
            properties.forEach((prop, propIndex) => {
                if (!item.keyframes[prop]) return;
                
                const lane = createElement('div', {
                    classes: 'keyframe-lane',
                    styles: {
                        top: (verticalPadding + subLaneOffset + propIndex * 7) + 'px',
                        height: '7px'
                    }
                });
                
                item.keyframes[prop].forEach((kf, kfIndex) => {
                    const indicator = createKeyframeIndicator(kf, prop, originalIndex, kfIndex);
                    lane.appendChild(indicator);
                });
                
                overlay.appendChild(lane);
            });
        });
        
        track.appendChild(overlay);
    });
}

/**
 * Create keyframe indicator element
 */
function createKeyframeIndicator(kf, prop, blockIndex, kfIndex) {
    // Check if this is the currently selected keyframe
    const isSelected = state.selection.keyframe && 
                      state.selection.keyframe.blockIndex === blockIndex &&
                      state.selection.keyframe.property === prop &&
                      state.selection.keyframe.keyframeIndex === kfIndex;
    
    const classes = `keyframe-indicator ${prop}${isSelected ? ' selected' : ''}`;
    
    // Snap keyframe visual position to nearest frame (non-destructive)
    const visualTime = snapToFrame(kf.time);
    
    const indicator = createElement('div', {
        classes: classes,
        attributes: {
            'data-block-index': blockIndex,
            'data-property': prop,
            'data-keyframe-index': kfIndex,
            title: `${prop} @ ${kf.time.toFixed(2)}s\nClick: seek to time\nDrag: move keyframe\nAlt+Click: delete\nRight-click: delete`
        },
        styles: {
            left: (visualTime * state.timeline.zoom) + 'px',
            top: '0px'
        }
    });
    
    // Context menu for delete (right-click)
    indicator.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteKeyframe(blockIndex, prop, kfIndex);
    });
    
    indicator.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent default browser drag behavior
        e.stopPropagation(); // Stop propagation to parent elements (e.g., timeline block drag)
        
        // Check for Alt+Click to delete
        if (e.altKey) {
            deleteKeyframe(blockIndex, prop, kfIndex);
            return;
        }
        
        // Set state for potential drag (no immediate playhead move)
        state.interaction.isDraggingKeyframe = false; // Will be set to true on mousemove after threshold
        state.interaction.isKeyframeDragStarted = true;
        state.interaction.draggedKeyframe = { blockIndex, property: prop, keyframeIndex: kfIndex };
        state.interaction.keyframeDragStartX = e.clientX;
        state.interaction.keyframeInitialTime = kf.time;

        document.addEventListener('mousemove', handleKeyframeMouseMove);
        document.addEventListener('mouseup', handleKeyframeMouseUp);
    });
    
    return indicator;
}

/**
 * Handle keyframe mouse move (for dragging)
 */
function handleKeyframeMouseMove(e) {
    if (!state.project || !state.interaction.isKeyframeDragStarted) return;

    const { draggedKeyframe, keyframeDragStartX, keyframeInitialTime } = state.interaction;
    if (!draggedKeyframe) return;

    const item = state.project.timeline[draggedKeyframe.blockIndex];
    if (!item || !item.keyframes || !item.keyframes[draggedKeyframe.property]) return;

    const dx = e.clientX - keyframeDragStartX;
    const deltaTime = dx / state.timeline.zoom;

    // Only start dragging if threshold is met
    if (!state.interaction.isDraggingKeyframe && (Math.abs(dx) > 2)) { // 2px threshold
        state.interaction.isDraggingKeyframe = true;
        // Do NOT call selectKeyframe here, playhead will follow during drag
    }

    if (state.interaction.isDraggingKeyframe) {
        let newTime = keyframeInitialTime + deltaTime;

        // Clamp newTime to item's start/end time and project duration
        newTime = Math.max(item.startTime, Math.min(item.endTime, newTime));
        newTime = Math.max(0, Math.min(state.project.project.duration, newTime));
        
        // Snap to nearest frame
        newTime = snapToFrame(newTime);

        const keyframe = item.keyframes[draggedKeyframe.property][draggedKeyframe.keyframeIndex];
        if (keyframe) {
            keyframe.time = newTime;
            renderKeyframeIndicators();
            updatePlayhead(); // Update playhead to new keyframe time during drag
            updateViewport();
        }
    }
}

/**
 * Handle keyframe mouse up (end drag / click)
 */
function handleKeyframeMouseUp(e) {
    document.removeEventListener('mousemove', handleKeyframeMouseMove);
    document.removeEventListener('mouseup', handleKeyframeMouseUp);

    const { isDraggingKeyframe, draggedKeyframe } = state.interaction;

    if (isDraggingKeyframe) {
        // It was a drag - record change and save
        const { recordChange } = import('../core/history.js');
        const { blockIndex, property } = draggedKeyframe;
        const item = state.project.timeline[blockIndex];
        const assetId = item.assetId || 'element';
        recordChange(`Moved ${property} keyframe for ${assetId}`);
        queueProjectSave();
        // Playhead already followed during drag, so no additional update here
    } else {
        // It was a click (no drag) - select keyframe and move playhead
        if (draggedKeyframe) {
            selectKeyframe(draggedKeyframe.blockIndex, draggedKeyframe.property, draggedKeyframe.keyframeIndex);
        }
    }

    // Clear interaction state
    state.interaction.isDraggingKeyframe = false;
    state.interaction.isKeyframeDragStarted = false;
    state.interaction.draggedKeyframe = null;
    state.interaction.keyframeDragStartX = 0;
    state.interaction.keyframeInitialTime = 0;

    renderKeyframeIndicators(); // Ensure final position is rendered
    updateViewport(); // Ensure viewport updates after interaction
}

/**
 * Select keyframe and seek to its time
 */
function selectKeyframe(blockIndex, property, keyframeIndex) {
    console.log('selectKeyframe called:', { blockIndex, property, keyframeIndex });
    
    const item = state.project.timeline[blockIndex];
    if (!item.keyframes || !item.keyframes[property]) {
        console.log('No keyframes found for item');
        return;
    }
    
    const keyframe = item.keyframes[property][keyframeIndex];
    if (!keyframe) {
        console.log('Keyframe not found');
        return;
    }
    
    console.log('Keyframe time:', keyframe.time);
    console.log('Current time before:', state.currentTime);
    
    // Store selection
    state.selection.keyframe = { blockIndex, property, keyframeIndex };
    state.selection.element = blockIndex;
    
    // Seek timeline to keyframe time
    state.currentTime = keyframe.time;
    
    console.log('Current time after:', state.currentTime);
    console.log('Calling updatePlayhead...');
    
    // Update UI - playhead first, then viewport
    updatePlayhead();
    updateViewport();
    renderKeyframeIndicators();
    
    console.log(`✓ Seeked to ${property} keyframe at ${keyframe.time.toFixed(2)}s`);
    
    // Show animation button
    getById('animationBtn').style.display = 'inline-block';
}

/**
 * Delete keyframe (with undo support)
 */
async function deleteKeyframe(blockIndex, property, keyframeIndex) {
    const item = state.project.timeline[blockIndex];
    if (!item.keyframes || !item.keyframes[property]) return;
    
    // Don't delete if only one keyframe left
    if (item.keyframes[property].length <= 1) {
        alert('Cannot delete the last keyframe. Delete the property track instead.');
        return;
    }
    
    const deletedKf = item.keyframes[property][keyframeIndex];
    const assetId = item.assetId || 'element';
    
    // Delete keyframe
    item.keyframes[property].splice(keyframeIndex, 1);
    
    // Remove property track if no keyframes left
    if (item.keyframes[property].length === 0) {
        delete item.keyframes[property];
    }
    
    // Remove keyframes object if empty
    if (Object.keys(item.keyframes).length === 0) {
        delete item.keyframes;
    }
    
    // Clear selection if this was the selected keyframe
    if (state.selection.keyframe && 
        state.selection.keyframe.blockIndex === blockIndex &&
        state.selection.keyframe.property === property &&
        state.selection.keyframe.keyframeIndex === keyframeIndex) {
        state.selection.keyframe = null;
    }
    
    // Record change for undo/redo
    const { recordChange } = await import('../core/history.js');
    recordChange(`Deleted ${property} keyframe at ${deletedKf.time.toFixed(2)}s from ${assetId}`);
    
    renderTimeline();
    renderKeyframeIndicators();
    updateViewport();
    queueProjectSave();
    
    console.log(`Deleted ${property} keyframe at ${deletedKf.time.toFixed(2)}s`);
}

/**
 * Add keyframe at current time
 */
export function addKeyframeAtCurrentTime(blockIndex, property) {
    const item = state.project.timeline[blockIndex];
    
    // Get current value (interpolated or base)
    const keyframedItem = applyKeyframes(item, state.currentTime);
    let value;
    
    switch(property) {
        case 'position':
            value = { x: keyframedItem.position.x, y: keyframedItem.position.y };
            break;
        case 'size':
            value = { width: keyframedItem.size.width, height: keyframedItem.size.height };
            break;
        case 'rotation':
            value = keyframedItem.rotation;
            break;
        case 'opacity':
            value = keyframedItem.opacity;
            break;
    }
    
    // Initialize keyframes structure
    if (!item.keyframes) {
        item.keyframes = {};
    }
    if (!item.keyframes[property]) {
        item.keyframes[property] = [];
    }
    
    // Check if keyframe already exists at this time
    const existing = item.keyframes[property].findIndex(kf => Math.abs(kf.time - state.currentTime) < 0.01);
    
    if (existing >= 0) {
        // Update existing keyframe
        item.keyframes[property][existing].value = value;
    } else {
        // Add new keyframe
        item.keyframes[property].push({
            time: state.currentTime,
            value: value,
            easing: 'linear'
        });
        
        // Sort by time
        item.keyframes[property].sort((a, b) => a.time - b.time);
    }
    
    renderTimeline();
    renderKeyframeIndicators();
    console.log(`Added ${property} keyframe at ${state.currentTime.toFixed(2)}s`);
    queueProjectSave();
}

/**
 * Insert keyframe (called from panel)
 */
export function insertKeyframe(property) {
    if (state.selection.block === null) {
        alert('Please select a timeline block first');
        return;
    }
    
    addKeyframeAtCurrentTime(state.selection.block, property);
}

/**
 * Delta (offset) all keyframes of a property by a given amount
 * This is used for Ctrl+Drag to adjust all keyframes at once
 */
export function deltaAllKeyframes(blockIndex, property, delta) {
    const item = state.project.timeline[blockIndex];
    
    // If no keyframes exist for this property, update base value only
    if (!item.keyframes || !item.keyframes[property]) {
        if (property === 'position') {
            item.position.x += delta.x;
            item.position.y += delta.y;
        } else if (property === 'size') {
            item.size.width += delta.width;
            item.size.height += delta.height;
        } else if (property === 'rotation') {
            item.rotation += delta;
        }
        return;
    }
    
    // Apply delta to ALL keyframes
    item.keyframes[property].forEach(kf => {
        if (property === 'position') {
            kf.value.x += delta.x;
            kf.value.y += delta.y;
        } else if (property === 'size') {
            kf.value.width += delta.width;
            kf.value.height += delta.height;
        } else if (property === 'rotation') {
            kf.value += delta;
        } else if (property === 'opacity') {
            kf.value = Math.max(0, Math.min(1, kf.value + delta));
        }
    });
    
    // Also update base value
    if (property === 'position') {
        item.position.x += delta.x;
        item.position.y += delta.y;
    } else if (property === 'size') {
        item.size.width += delta.width;
        item.size.height += delta.height;
    } else if (property === 'rotation') {
        item.rotation += delta;
    } else if (property === 'opacity') {
        item.opacity = Math.max(0, Math.min(1, item.opacity + delta));
    }
}

// Expose to window for HTML onclick
if (typeof window !== 'undefined') {
    window.insertKeyframe = insertKeyframe;
}

