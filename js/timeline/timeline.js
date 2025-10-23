/* ============================================
   TIMELINE - Render timeline tracks & ruler
   ============================================ */

import { state } from '../state/state.js';
import { getById, clearElement, createElement } from '../utils/dom.js';
import { TIMELINE_COLORS } from '../state/constants.js';
import { renderKeyframeIndicators } from '../keyframes/keyframe-ui.js';

/**
 * Setup timeline
 */
export function setupTimeline() {
    if (!state.project) return;
    renderTimeline();
}

/**
 * Render timeline (ruler, tracks, blocks)
 */
export function renderTimeline() {
    if (!state.project) return;
    
    const tracks = getById('timelineTracks');
    const ruler = getById('timelineRuler');
    
    clearElement(tracks);
    clearElement(ruler);
    
    const duration = state.project.project.duration;
    const rulerWidth = duration * state.timeline.zoom;
    ruler.style.width = rulerWidth + 'px';
    
    // Render ruler
    renderRuler(ruler, duration);
    
    // Render tracks
    renderTracks(tracks, rulerWidth);
    
    // Update transform
    updateTimelineTransform();
    
    // Render keyframe indicators
    renderKeyframeIndicators();
}

/**
 * Render ruler marks and labels
 */
function renderRuler(ruler, duration) {
    for (let i = 0; i <= Math.ceil(duration); i++) {
        const x = i * state.timeline.zoom;
        
        const mark = createElement('div', {
            classes: 'ruler-mark',
            styles: { left: x + 'px' }
        });
        ruler.appendChild(mark);
        
        const label = createElement('div', {
            classes: 'ruler-label',
            textContent: i + 's',
            styles: { left: x + 'px' }
        });
        ruler.appendChild(label);
    }
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
}

/**
 * Assign blocks to sub-lanes based on overlaps
 */
function assignSubLanes(blocks) {
    // Sort blocks by start time
    const sortedBlocks = [...blocks].sort((a, b) => a.item.startTime - b.item.startTime);
    
    // Track which sub-lanes are occupied at each time
    const subLanes = [];
    
    sortedBlocks.forEach(block => {
        // Find the first available sub-lane for this block
        let assignedLane = 0;
        let foundLane = false;
        
        for (let lane = 0; lane < subLanes.length; lane++) {
            // Check if this lane is free for our block's time range
            const conflicts = subLanes[lane].some(existingBlock => 
                timeRangesOverlap(
                    block.item.startTime, block.item.endTime,
                    existingBlock.item.startTime, existingBlock.item.endTime
                )
            );
            
            if (!conflicts) {
                assignedLane = lane;
                foundLane = true;
                break;
            }
        }
        
        // If no free lane found, create a new one
        if (!foundLane) {
            assignedLane = subLanes.length;
            subLanes.push([]);
        }
        
        // Assign block to this lane
        block.subLane = assignedLane;
        subLanes[assignedLane].push(block);
    });
    
    return subLanes.length;
}

/**
 * Render timeline tracks and blocks
 */
function renderTracks(tracks, rulerWidth) {
    // Group timeline items by assetId
    const assetGroups = {};
    state.project.timeline.forEach((item, index) => {
        if (!assetGroups[item.assetId]) {
            assetGroups[item.assetId] = [];
        }
        assetGroups[item.assetId].push({ item, originalIndex: index });
    });
    
    // Create tracks
    Object.keys(assetGroups).forEach((assetId, trackIndex) => {
        const blocks = assetGroups[assetId];
        
        // Assign sub-lanes for overlapping blocks
        const numSubLanes = assignSubLanes(blocks);
        
        // Calculate track height based on number of sub-lanes
        const baseHeight = 28; // Base block height
        const verticalPadding = 7; // Top padding
        const subLaneSpacing = 4; // Spacing between sub-lanes
        const trackHeight = verticalPadding + (numSubLanes * (baseHeight + subLaneSpacing));
        
        const track = createElement('div', {
            classes: 'timeline-track',
            attributes: { 'data-track-index': trackIndex },
            styles: { height: trackHeight + 'px' }
        });
        
        const label = createElement('div', {
            classes: 'track-label',
            textContent: assetId
        });
        track.appendChild(label);
        
        // Add blocks for this track with sub-lane positioning
        blocks.forEach(({ item, originalIndex, subLane }) => {
            const block = createTimelineBlock(item, originalIndex, trackIndex, subLane);
            track.appendChild(block);
        });
        
        tracks.appendChild(track);
    });
    
    tracks.style.width = rulerWidth + 'px';
}

/**
 * Create timeline block element
 */
function createTimelineBlock(item, originalIndex, trackIndex, subLane = 0) {
    const isPrimarySelected = state.selection.block === originalIndex || state.selection.element === originalIndex;
    const isInMultiSelection = state.selection.elements && state.selection.elements.includes(originalIndex);
    const hasMultipleSelected = state.selection.elements && state.selection.elements.length > 1;
    
    // Calculate vertical position based on sub-lane
    const baseHeight = 28;
    const verticalPadding = 7;
    const subLaneSpacing = 4;
    const topOffset = verticalPadding + (subLane * (baseHeight + subLaneSpacing));
    
    const classes = ['timeline-block'];
    
    // Apply selection classes
    if (hasMultipleSelected && isInMultiSelection) {
        // Part of multi-selection - show orange outline
        classes.push('multi-selected');
        if (isPrimarySelected) classes.push('selected'); // Primary gets both for precedence
    } else if (isPrimarySelected) {
        // Single selection - show blue outline
        classes.push('selected');
    }
    
    const block = createElement('div', {
        classes: classes.filter(Boolean),
        attributes: {
            'data-block-index': originalIndex,
            'data-asset-id': item.assetId,
            'data-sub-lane': subLane  // Store sub-lane for keyframe positioning
        },
        styles: {
            left: (item.startTime * state.timeline.zoom) + 'px',
            width: ((item.endTime - item.startTime) * state.timeline.zoom) + 'px',
            top: topOffset + 'px',
            background: TIMELINE_COLORS[trackIndex % TIMELINE_COLORS.length]
        }
    });
    
    const textNode = createElement('span', {
        textContent: item.assetId,
        styles: { pointerEvents: 'none' }
    });
    block.appendChild(textNode);
    
    // Add resize handles
    const leftHandle = createElement('div', {
        classes: 'timeline-block-resize-handle left',
        attributes: { 'data-handle': 'left' }
    });
    block.appendChild(leftHandle);
    
    const rightHandle = createElement('div', {
        classes: 'timeline-block-resize-handle right',
        attributes: { 'data-handle': 'right' }
    });
    block.appendChild(rightHandle);
    
    return block;
}

/**
 * Update timeline transform (pan/zoom)
 */
export function updateTimelineTransform() {
    const ruler = getById('timelineRuler');
    const tracks = getById('timelineTracks');
    const playheadContainer = getById('playheadContainer');
    const playhead = getById('playhead');
    
    ruler.style.transform = `translateX(${state.timeline.panX}px)`;
    tracks.style.transform = `translate(${state.timeline.panX}px, ${state.timeline.panY}px)`;
    
    // Playhead container doesn't pan vertically - only horizontally
    playheadContainer.style.transform = `translateX(${state.timeline.panX}px)`;
    // Playhead position within its container
    playhead.style.transform = `translateX(${state.currentTime * state.timeline.zoom}px)`;
}

