/* ============================================
   TIMELINE INTERACTION - Pan, Zoom, Drag Blocks
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { renderTimeline, updateTimelineTransform } from './timeline.js';
import { updatePlayhead } from './playhead.js';
import { updateViewport } from '../viewport/viewport.js';
import { togglePlayback } from '../core/playback.js';
import { queueProjectSave } from '../core/project-v2.js';
import { recordChange } from '../core/history.js';
import { DEFAULT_TIMELINE } from '../state/constants.js';
import { renderKeyframeIndicators } from '../keyframes/keyframe-ui.js';
import { selectElement, selectMultipleElements } from '../ui/selection-manager.js';
import { snapToFrame } from '../utils/time-utils.js';

/**
 * Setup timeline interaction (pan, zoom, drag blocks)
 */
export function setupTimelineInteraction() {
    const container = getById('timelineContainer');
    const playhead = getById('playhead');
    
    container.addEventListener('mousedown', handleTimelineMouseDown);
    container.addEventListener('mousemove', handleTimelineMouseMove);
    container.addEventListener('wheel', handleTimelineWheel, { passive: false });
    container.addEventListener('click', handleTimelineClick);
    
    // Prevent context menu on right-click (we use it for panning)
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', handleTimelineMouseUp);
}

/**
 * Delete keyframe (called from Alt+Click)
 */
function deleteKeyframeFromTimeline(blockIndex, property, keyframeIndex) {
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
    
    recordChange(`Deleted ${property} keyframe at ${deletedKf.time.toFixed(2)}s from ${assetId}`);
    
    renderTimeline();
    renderKeyframeIndicators();
    updateViewport();
    queueProjectSave();
    
    console.log(`Deleted ${property} keyframe at ${deletedKf.time.toFixed(2)}s`);
}

/**
 * Handle mouse down on timeline
 */
function handleTimelineMouseDown(e) {
    if (!state.project) return;
    
    const keyframeIndicator = e.target.closest('.keyframe-indicator');
    const block = e.target.closest('.timeline-block');
    const handle = e.target.classList.contains('timeline-block-resize-handle') ? e.target : null;
    const playheadHandle = e.target.classList.contains('playhead-handle');
    
    // Keyframe interactions (highest priority - before block)
    if (keyframeIndicator) {
        // Alt+Click or Ctrl+Click to delete
        if (e.altKey || e.ctrlKey) {
            const blockIndex = parseInt(keyframeIndicator.dataset.blockIndex);
            const property = keyframeIndicator.dataset.property;
            const kfIndex = parseInt(keyframeIndicator.dataset.keyframeIndex);
            deleteKeyframeFromTimeline(blockIndex, property, kfIndex);
            e.stopPropagation();
            return;
        }
        
        // Normal click/drag
        startKeyframeDrag(keyframeIndicator, e);
        // Don't stop propagation here - let click event fire if no drag occurs
        return;
    }
    
    // Playhead dragging
    if (playheadHandle) {
        state.interaction.isDraggingPlayhead = true;
        if (state.isPlaying) togglePlayback();
        e.stopPropagation();
        return;
    }
    
    // Right-click (button 2) always pans, even if over a block
    if (e.button === 2) {
        e.preventDefault();
        startPanning(e);
        return;
    }
    
    // Block resizing (only for left-click)
    if (handle && block && e.button === 0) {
        startBlockResize(block, handle, e);
        e.stopPropagation();
        return;
    }
    
    // Block dragging (only for left-click)
    if (block && e.button === 0) {
        startBlockDrag(block, e);
        e.stopPropagation();
        return;
    }
    
    // Middle mouse panning
    if (e.button === 1) {
        e.preventDefault();
        startPanning(e);
    } else if (!block && !handle && !playheadHandle) {
        // Clicked on timeline background - seek to time
        seekToClickedTime(e);
        state.interaction.isDraggingTimelineBackground = true;
    }
}

/**
 * Start panning timeline
 */
function startPanning(e) {
    state.interaction.isPanning = true;
    state.interaction.dragStartX = e.clientX;
    state.interaction.dragStartY = e.clientY;
    state.interaction.dragStartPanX = state.timeline.panX;
    state.interaction.dragStartPanY = state.timeline.panY;
    getById('timelineContainer').classList.add('grabbing');
}

/**
 * Start dragging keyframe (with drag threshold)
 */
function startKeyframeDrag(indicator, e) {
    const blockIndex = parseInt(indicator.dataset.blockIndex);
    const property = indicator.dataset.property;
    const kfIndex = parseInt(indicator.dataset.keyframeIndex);
    
    const item = state.project.timeline[blockIndex];
    if (!item || !item.keyframes || !item.keyframes[property]) return;
    
    const keyframe = item.keyframes[property][kfIndex];
    if (!keyframe) return;
    
    // Store drag intent, but don't start dragging yet (wait for movement)
    state.interaction.keyframeDragIntent = true;
    state.interaction.draggedKeyframeBlockIndex = blockIndex;
    state.interaction.draggedKeyframeProperty = property;
    state.interaction.draggedKeyframeIndex = kfIndex;
    state.interaction.dragStartX = e.clientX;
    state.interaction.dragStartY = e.clientY;
    state.interaction.draggedKeyframeInitialTime = keyframe.time;
    
    // Select this keyframe
    state.selection.keyframe = {
        blockIndex,
        property,
        keyframeIndex: kfIndex
    };
    
    renderTimeline();
    updateTimelineTransform();
}

/**
 * Start dragging block
 */
function startBlockDrag(block, e) {
    const blockIndex = parseInt(block.dataset.blockIndex);
    
    // Check if this block is already in selection
    const isAlreadySelected = state.selection.elements && state.selection.elements.includes(blockIndex);
    
    // Use centralized selection system with shift support
    if (!isAlreadySelected || !e.shiftKey) {
        selectElement(blockIndex, 'timeline', false, e.shiftKey);
    }
    
    state.interaction.isDraggingBlock = true;
    state.interaction.draggedBlockIndex = blockIndex;
    state.interaction.dragStartX = e.clientX;
    state.interaction.dragStartY = e.clientY;
    
    // Store initial positions for ALL selected blocks
    state.interaction.draggedBlocksInitialData = state.selection.elements.map(idx => {
        const item = state.project.timeline[idx];
        return {
            index: idx,
            startTime: item.startTime,
            endTime: item.endTime
        };
    });
    
    // Add dragging class to all selected blocks for visual feedback
    state.selection.elements.forEach(idx => {
        const blockEl = document.querySelector(`.timeline-block[data-block-index="${idx}"]`);
        if (blockEl) blockEl.classList.add('dragging');
    });
    
    getById('timelineContainer').classList.add('editing');
    getById('editModeIndicator').style.display = 'block';
}

/**
 * Start resizing block
 */
function startBlockResize(block, handle, e) {
    state.interaction.isResizingBlock = true;
    state.interaction.resizeHandle = handle.dataset.handle;
    state.interaction.draggedBlockIndex = parseInt(block.dataset.blockIndex);
    state.interaction.dragStartX = e.clientX;
    
    const item = state.project.timeline[state.interaction.draggedBlockIndex];
    state.interaction.draggedBlockInitialStart = item.startTime;
    state.interaction.draggedBlockInitialEnd = item.endTime;
    
    // Use centralized selection system
    selectElement(state.interaction.draggedBlockIndex, 'timeline', false);
    
    renderTimeline();
    updateTimelineTransform();
}

/**
 * Seek to clicked time (snapped to frames)
 */
function seekToClickedTime(e) {
    if (state.isPlaying) togglePlayback();
    
    const container = getById('timelineContainer');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - state.timeline.panX;
    const rawTime = x / state.timeline.zoom;
    const clampedTime = Math.max(0, Math.min(state.project.project.duration, rawTime));
    
    // Snap to frame boundary
    state.currentTime = snapToFrame(clampedTime);
    
    updatePlayhead();
    updateViewport();
}

/**
 * Handle mouse move on timeline
 */
function handleTimelineMouseMove(e) {
    const { 
        isDraggingPlayhead, 
        isDraggingTimelineBackground,
        isResizingBlock,
        isDraggingBlock,
        isDraggingKeyframe,
        isPanning
    } = state.interaction;
    
    // Playhead or timeline background dragging
    if (isDraggingPlayhead || isDraggingTimelineBackground) {
        seekToClickedTime(e);
        return;
    }
    
    // Keyframe dragging (or drag intent)
    if (isDraggingKeyframe || state.interaction.keyframeDragIntent) {
        handleKeyframeDrag(e);
        return;
    }
    
    // Block resizing
    if (isResizingBlock) {
        handleBlockResize(e);
        return;
    }
    
    // Block dragging
    if (isDraggingBlock) {
        handleBlockDrag(e);
        return;
    }
    
    // Panning
    if (isPanning) {
        const dx = e.clientX - state.interaction.dragStartX;
        const dy = e.clientY - state.interaction.dragStartY;
        state.timeline.panX = state.interaction.dragStartPanX + dx;
        state.timeline.panY = state.interaction.dragStartPanY + dy;
        updateTimelineTransform();
    }
}

/**
 * Handle keyframe drag movement (with drag threshold)
 */
function handleKeyframeDrag(e) {
    // Check if we have drag intent but haven't started dragging yet
    if (state.interaction.keyframeDragIntent && !state.interaction.isDraggingKeyframe) {
        const dx = Math.abs(e.clientX - state.interaction.dragStartX);
        const dy = Math.abs(e.clientY - state.interaction.dragStartY);
        
        // Only start dragging if moved more than 3 pixels (drag threshold)
        if (dx > 3 || dy > 3) {
            state.interaction.isDraggingKeyframe = true;
            state.interaction.keyframeDragIntent = false;
            e.stopPropagation(); // Now prevent other interactions
            e.preventDefault(); // Prevent text selection while dragging
        } else {
            return; // Not enough movement yet
        }
    }
    
    if (!state.interaction.isDraggingKeyframe) return;
    
    const dx = e.clientX - state.interaction.dragStartX;
    const deltaTime = dx / state.timeline.zoom;
    
    const item = state.project.timeline[state.interaction.draggedKeyframeBlockIndex];
    const property = state.interaction.draggedKeyframeProperty;
    const kfIndex = state.interaction.draggedKeyframeIndex;
    
    if (!item || !item.keyframes || !item.keyframes[property]) return;
    
    const keyframe = item.keyframes[property][kfIndex];
    if (!keyframe) return;
    
    // Calculate new time, clamped to block's time range
    let newTime = state.interaction.draggedKeyframeInitialTime + deltaTime;
    newTime = Math.max(item.startTime, Math.min(item.endTime, newTime));
    
    // Update keyframe time
    keyframe.time = newTime;
    
    // Sort keyframes by time to maintain order
    item.keyframes[property].sort((a, b) => a.time - b.time);
    
    renderTimeline();
    updateTimelineTransform();
    updateViewport();
}

/**
 * Handle block resize movement
 */
function handleBlockResize(e) {
    const dx = e.clientX - state.interaction.dragStartX;
    const deltaTime = dx / state.timeline.zoom;
    const block = state.project.timeline[state.interaction.draggedBlockIndex];
    
    if (state.interaction.resizeHandle === 'left') {
        const newStart = Math.max(0, state.interaction.draggedBlockInitialStart + deltaTime);
        if (newStart < block.endTime - 0.1) {
            block.startTime = newStart;
            
            // Remove keyframes that are now outside the block's time range
            removeOutOfBoundsKeyframes(block);
        }
    } else {
        const newEnd = Math.min(
            state.project.project.duration, 
            state.interaction.draggedBlockInitialEnd + deltaTime
        );
        if (newEnd > block.startTime + 0.1) {
            block.endTime = newEnd;
            
            // Remove keyframes that are now outside the block's time range
            removeOutOfBoundsKeyframes(block);
        }
    }
    
    renderTimeline();
    updateTimelineTransform();
    updateViewport();
}

/**
 * Remove keyframes that fall outside a block's time range
 */
function removeOutOfBoundsKeyframes(item) {
    if (!item.keyframes) return;
    
    const properties = ['position', 'size', 'rotation', 'opacity', 'scale'];
    
    properties.forEach(prop => {
        if (!item.keyframes[prop]) return;
        
        // Filter out keyframes outside the block's time range
        const originalCount = item.keyframes[prop].length;
        item.keyframes[prop] = item.keyframes[prop].filter(
            kf => kf.time >= item.startTime && kf.time <= item.endTime
        );
        
        const removedCount = originalCount - item.keyframes[prop].length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} ${prop} keyframe(s) outside block range`);
        }
        
        // Clean up empty keyframe arrays
        if (item.keyframes[prop].length === 0) {
            delete item.keyframes[prop];
        }
    });
    
    // Clean up keyframes object if empty
    if (Object.keys(item.keyframes).length === 0) {
        delete item.keyframes;
    }
}

/**
 * Handle block drag movement
 */
function handleBlockDrag(e) {
    const dx = e.clientX - state.interaction.dragStartX;
    const deltaTime = dx / state.timeline.zoom;
    
    // Move ALL selected blocks together
    if (!state.interaction.draggedBlocksInitialData) return;
    
    // Calculate the unclamped new position for the primary dragged block
    const primaryData = state.interaction.draggedBlocksInitialData.find(
        d => d.index === state.interaction.draggedBlockIndex
    );
    if (!primaryData) return;
    
    const duration = primaryData.endTime - primaryData.startTime;
    let newStart = primaryData.startTime + deltaTime;
    
    // Clamp to project bounds
    newStart = Math.max(0, Math.min(state.project.project.duration - duration, newStart));
    
    // Calculate the actual shift applied (accounting for clamping)
    const actualDeltaTime = newStart - primaryData.startTime;
    
    // Apply this same delta to ALL selected blocks
    state.interaction.draggedBlocksInitialData.forEach(data => {
        const block = state.project.timeline[data.index];
        if (!block) return;
        
        const blockDuration = data.endTime - data.startTime;
        let blockNewStart = data.startTime + actualDeltaTime;
        
        // Clamp each block individually
        blockNewStart = Math.max(0, Math.min(state.project.project.duration - blockDuration, blockNewStart));
        
        // Calculate shift for keyframes
        const blockActualShift = blockNewStart - block.startTime;
        
        // Shift all keyframes by the same amount
        if (blockActualShift !== 0 && block.keyframes) {
            const properties = ['position', 'size', 'rotation', 'opacity', 'scale'];
            
            properties.forEach(prop => {
                if (!block.keyframes[prop]) return;
                
                block.keyframes[prop].forEach(kf => {
                    kf.time += blockActualShift;
                });
            });
        }
        
        block.startTime = blockNewStart;
        block.endTime = blockNewStart + blockDuration;
    });
    
    renderTimeline();
    updateTimelineTransform();
    updateViewport();
}

/**
 * Handle mouse up
 */
function handleTimelineMouseUp(e) {
    const {
        isDraggingPlayhead,
        isDraggingTimelineBackground,
        isResizingBlock,
        isDraggingBlock,
        isDraggingKeyframe,
        isPanning
    } = state.interaction;
    
    if (isDraggingPlayhead) {
        state.interaction.isDraggingPlayhead = false;
    }
    
    if (isDraggingTimelineBackground) {
        state.interaction.isDraggingTimelineBackground = false;
    }
    
    if (isDraggingKeyframe) {
        const item = state.project.timeline[state.interaction.draggedKeyframeBlockIndex];
        const property = state.interaction.draggedKeyframeProperty;
        
        if (item) {
            recordChange(`Moved ${property} keyframe for ${item.assetId || 'item'}`);
        }
        
        // Set flag to prevent click event from firing after drag
        state.interaction.justFinishedKeyframeDrag = true;
        setTimeout(() => {
            state.interaction.justFinishedKeyframeDrag = false;
        }, 100);
        
        state.interaction.isDraggingKeyframe = false;
        state.interaction.keyframeDragIntent = false;
        state.interaction.draggedKeyframeBlockIndex = -1;
        state.interaction.draggedKeyframeProperty = null;
        state.interaction.draggedKeyframeIndex = -1;
        state.interaction.draggedKeyframeInitialTime = 0;
        queueProjectSave();
    } else if (state.interaction.keyframeDragIntent) {
        // User clicked without dragging - seek to keyframe
        console.log('MouseUp: Keyframe click detected (no drag)');
        const blockIndex = state.interaction.draggedKeyframeBlockIndex;
        const property = state.interaction.draggedKeyframeProperty;
        const kfIndex = state.interaction.draggedKeyframeIndex;
        
        console.log('Keyframe data:', { blockIndex, property, kfIndex });
        
        if (blockIndex >= 0 && property && kfIndex >= 0) {
            const item = state.project.timeline[blockIndex];
            if (item?.keyframes?.[property]?.[kfIndex]) {
                const keyframe = item.keyframes[property][kfIndex];
                
                // Store selection
                state.selection.keyframe = { blockIndex, property, keyframeIndex: kfIndex };
                state.selection.element = blockIndex;
                
                // Seek timeline to keyframe time
                state.currentTime = keyframe.time;
                
                console.log(`✓ Clicked keyframe - Seeked to ${property} at ${keyframe.time.toFixed(2)}s`);
                
                // Update UI
                updatePlayhead();
                updateViewport();
                renderKeyframeIndicators();
                
                // Show animation button
                getById('animationBtn').style.display = 'inline-block';
            }
        }
        
        // Clear drag intent
        state.interaction.keyframeDragIntent = false;
        state.interaction.draggedKeyframeBlockIndex = -1;
        state.interaction.draggedKeyframeProperty = null;
        state.interaction.draggedKeyframeIndex = -1;
        state.interaction.draggedKeyframeInitialTime = 0;
    }
    
    if (isResizingBlock) {
        const item = state.project.timeline[state.interaction.draggedBlockIndex];
        if (item) {
            recordChange(`Resized ${item.assetId} timeline block`);
        }
        
        state.interaction.isResizingBlock = false;
        state.interaction.resizeHandle = null;
        state.interaction.draggedBlockIndex = -1;
        queueProjectSave();
    }
    
    if (isDraggingBlock) {
        // Record change for all moved blocks
        if (state.interaction.draggedBlocksInitialData) {
            const count = state.interaction.draggedBlocksInitialData.length;
            const msg = count > 1 
                ? `Moved ${count} timeline blocks` 
                : `Moved ${state.project.timeline[state.interaction.draggedBlockIndex]?.assetId || 'item'} timeline block`;
            recordChange(msg);
        }
        
        state.interaction.isDraggingBlock = false;
        state.interaction.draggedBlocksInitialData = null;
        
        // Remove dragging class from all blocks
        document.querySelectorAll('.timeline-block.dragging').forEach(block => {
            block.classList.remove('dragging');
        });
        
        getById('timelineContainer').classList.remove('editing');
        getById('editModeIndicator').style.display = 'none';
        state.interaction.draggedBlockIndex = -1;
        queueProjectSave();
    }
    
    if ((e.button === 1 || e.button === 2) && isPanning) {
        state.interaction.isPanning = false;
        getById('timelineContainer').classList.remove('grabbing');
    }
}

/**
 * Handle timeline click
 */
function handleTimelineClick(e) {
    if (!state.project) return;
    if (state.interaction.isDraggingBlock || state.interaction.isResizingBlock || state.interaction.isPanning) return;
    
    const block = e.target.closest('.timeline-block');
    if (block) {
        const blockIndex = parseInt(block.dataset.blockIndex);
        // Use centralized selection system with shift support
        selectElement(blockIndex, 'timeline', false, e.shiftKey);
        return;
    }
    
    // Timeline empty space clicks do nothing (don't deselect)
}

/**
 * Handle timeline wheel (zoom)
 */
function handleTimelineWheel(e) {
    e.preventDefault();
    
    if (!state.project) return;
    
    const container = getById('timelineContainer');
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - state.timeline.panX;
    const mouseTime = mouseX / state.timeline.zoom;
    
    if (!e.ctrlKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
            DEFAULT_TIMELINE.minZoom, 
            Math.min(DEFAULT_TIMELINE.maxZoom, state.timeline.zoom * zoomFactor)
        );
        
        const newMouseX = mouseTime * newZoom;
        state.timeline.panX += (mouseX - newMouseX);
        
        state.timeline.zoom = newZoom;
        renderTimeline();
        updateTimelineTransform();
    }
}

