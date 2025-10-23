/* ============================================
   TIME UTILITIES - Frame and timecode conversions
   ============================================ */

import { state } from '../state/state.js';

/**
 * Convert time (seconds) to frame number
 * @param {number} time - Time in seconds
 * @param {number} fps - Frames per second (optional, uses state.fps if not provided)
 * @returns {number} Frame number
 */
export function timeToFrame(time, fps = null) {
    const framerate = fps !== null ? fps : state.fps;
    return Math.floor(time * framerate);
}

/**
 * Convert frame number to time (seconds)
 * @param {number} frame - Frame number
 * @param {number} fps - Frames per second (optional, uses state.fps if not provided)
 * @returns {number} Time in seconds
 */
export function frameToTime(frame, fps = null) {
    const framerate = fps !== null ? fps : state.fps;
    return frame / framerate;
}

/**
 * Snap time to nearest frame boundary
 * @param {number} time - Time in seconds
 * @param {number} fps - Frames per second (optional, uses state.fps if not provided)
 * @returns {number} Snapped time in seconds
 */
export function snapToFrame(time, fps = null) {
    const frame = timeToFrame(time, fps);
    return frameToTime(frame, fps);
}

/**
 * Format time as timecode (mm:ss:ff)
 * @param {number} time - Time in seconds
 * @param {number} fps - Frames per second (optional, uses state.fps if not provided)
 * @returns {string} Timecode string
 */
export function formatTimecode(time, fps = null) {
    const framerate = fps !== null ? fps : state.fps;
    const totalFrames = Math.floor(time * framerate);
    
    const frames = totalFrames % framerate;
    const totalSeconds = Math.floor(totalFrames / framerate);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

/**
 * Parse timecode string to time in seconds
 * @param {string} timecode - Timecode string (mm:ss:ff)
 * @param {number} fps - Frames per second (optional, uses state.fps if not provided)
 * @returns {number} Time in seconds
 */
export function parseTimecode(timecode, fps = null) {
    const framerate = fps !== null ? fps : state.fps;
    const parts = timecode.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length !== 3) return 0;
    
    const [minutes, seconds, frames] = parts;
    const totalSeconds = minutes * 60 + seconds;
    const totalFrames = totalSeconds * framerate + frames;
    
    return totalFrames / framerate;
}

/**
 * Get total duration in frames
 * @returns {number} Total frames in project
 */
export function getTotalFrames() {
    if (!state.project || !state.project.project || !state.project.project.duration) return 0;
    return timeToFrame(state.project.project.duration);
}

/**
 * Get current frame number
 * @returns {number} Current frame
 */
export function getCurrentFrame() {
    return timeToFrame(state.currentTime);
}

