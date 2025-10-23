/* ============================================
   PLAYHEAD - Playhead control and display
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { snapToFrame, timeToFrame } from '../utils/time-utils.js';

/**
 * Update playhead position and display
 */
export function updatePlayhead() {
    if (!state.project) return;
    
    const playheadContainer = getById('playheadContainer');
    const playhead = getById('playhead');
    
    // Snap currentTime to frame boundary for discrete positioning
    const snappedTime = snapToFrame(state.currentTime);
    
    // Update container position (horizontal pan only)
    playheadContainer.style.transform = `translateX(${state.timeline.panX}px)`;
    
    // Update playhead position within container (time-based, but snapped to frames)
    playhead.style.transform = `translateX(${snappedTime * state.timeline.zoom}px)`;
    
    // Always update frame display (logic inside updateFrameDisplay will handle conditional rendering for performance)
    if (typeof window !== 'undefined' && window.updateFrameDisplay) {
        window.updateFrameDisplay();
    }
}

