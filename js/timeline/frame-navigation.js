/* ============================================
   FRAME NAVIGATION - FPS and frame-based controls
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { 
    timeToFrame, 
    frameToTime, 
    snapToFrame, 
    formatTimecode, 
    parseTimecode,
    getTotalFrames 
} from '../utils/time-utils.js';
import { updatePlayhead } from './playhead.js';
import { updateViewport } from '../viewport/viewport.js';

/**
 * Set FPS and update display
 */
export function setFPS(fps) {
    state.fps = fps;
    
    // Snap current time to new frame rate
    state.currentTime = snapToFrame(state.currentTime);
    
    // Update displays
    updateFrameDisplay();
    updatePlayhead();
    updateViewport();
    
    console.log(`FPS set to ${fps}`);
}

/**
 * Go to specific frame
 */
export function goToFrame(frame) {
    if (!state.project) return;
    
    const totalFrames = getTotalFrames();
    const clampedFrame = Math.max(0, Math.min(frame, totalFrames));
    
    state.currentTime = frameToTime(clampedFrame);
    
    updateFrameDisplay();
    updatePlayhead();
    updateViewport();
}

/**
 * Go to previous frame
 */
export function previousFrame() {
    if (!state.project) return;
    const currentFrame = timeToFrame(state.currentTime);
    goToFrame(currentFrame - 1);
}

/**
 * Go to next frame
 */
export function nextFrame() {
    if (!state.project) return;
    const currentFrame = timeToFrame(state.currentTime);
    goToFrame(currentFrame + 1);
}

/**
 * Go to time specified by timecode string
 */
export function goToTimecode(timecodeString) {
    if (!state.project || !state.project.project) return;
    
    const time = parseTimecode(timecodeString);
    const clampedTime = Math.max(0, Math.min(time, state.project.project.duration));
    
    state.currentTime = snapToFrame(clampedTime);
    
    updateFrameDisplay();
    updatePlayhead();
    updateViewport();
}

/**
 * Update all frame/time displays in UI
 */
export function updateFrameDisplay() {
    if (!state.project || !state.project.project || !state.project.project.duration) {
        // No project loaded - set defaults
        const frameInput = getById('frameInput');
        if (frameInput) frameInput.value = '0';
        
        const totalFramesEl = getById('totalFrames');
        if (totalFramesEl) totalFramesEl.textContent = '0';
        
        const timecodeInput = getById('timecodeInput');
        if (timecodeInput) timecodeInput.value = '00:00:00';
        
        const totalTimecodeEl = getById('totalTimecode');
        if (totalTimecodeEl) totalTimecodeEl.textContent = '00:00:00';
        
        return;
    }
    
    const currentFrame = timeToFrame(state.currentTime);
    const totalFrames = getTotalFrames();
    const currentTimecode = formatTimecode(state.currentTime);
    const totalTimecode = formatTimecode(state.project.project.duration);
    
    // Update frame input
    const frameInput = getById('frameInput');
    if (frameInput) frameInput.value = currentFrame;
    
    // Update timecode input
    const timecodeInput = getById('timecodeInput');
    if (timecodeInput) timecodeInput.value = currentTimecode;

    // Only update total frames and total timecode if not playing
    // These values are static during playback, so updating them every frame is wasteful
    if (!state.isPlaying) {
        // Update total frames
        const totalFramesEl = getById('totalFrames');
        if (totalFramesEl) totalFramesEl.textContent = totalFrames;
        
        // Update total timecode
        const totalTimecodeEl = getById('totalTimecode');
        if (totalTimecodeEl) totalTimecodeEl.textContent = totalTimecode;
    }
}

/**
 * Initialize FPS selector from state
 */
export function initializeFPSSelector() {
    const fpsSelector = getById('fpsSelector');
    if (fpsSelector) {
        fpsSelector.value = state.fps.toString();
    }
}

