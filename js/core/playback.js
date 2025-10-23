/* ============================================
   PLAYBACK - Animation Loop & Time Control
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { updateViewport } from '../viewport/viewport.js';
import { updatePlayhead } from '../timeline/playhead.js';
import { timeToFrame, frameToTime } from '../utils/time-utils.js';

/**
 * Control all video elements in viewport
 */
function controlVideosPlayback(shouldPlay) {
    // Control background video
    const bgVideo = getById('backgroundVideo');
    if (bgVideo) {
        if (shouldPlay) {
            bgVideo.play().catch(() => {});
        } else {
            bgVideo.pause();
        }
    }
    
    // Control any videos in canvas (e.g., timeline items with video masks)
    const canvas = getById('viewportCanvas');
    if (canvas) {
        const videos = canvas.querySelectorAll('video');
        videos.forEach(video => {
            if (shouldPlay) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }
}

/**
 * Toggle play/pause
 */
export function togglePlayback() {
    if (!state.project || !state.project.project) {
        console.warn('Cannot play: No project loaded');
        return;
    }
    
    state.isPlaying = !state.isPlaying;
    
    const btn = getById('playBtn');
    if (!btn) {
        console.error('Play button not found');
        return;
    }
    
    btn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play';
    
    if (state.isPlaying) {
        // Reset lastFrameTime to 0 - animate() will set it on first frame
        state.lastFrameTime = 0;
        controlVideosPlayback(true);
    } else {
        controlVideosPlayback(false);
        // Update frame display when stopping (was skipped during playback)
        if (typeof window !== 'undefined' && window.updateFrameDisplay) {
            window.updateFrameDisplay();
        }
    }
}

/**
 * Main animation loop (with frame-based timing)
 */
export function animate(timestamp) {
    if (state.isPlaying && state.project) {
        // Initialize lastFrameTime on first frame after play
        if (state.lastFrameTime === 0) {
            state.lastFrameTime = timestamp;
        }
        
        const deltaTime = (timestamp - state.lastFrameTime) / 1000;
        state.lastFrameTime = timestamp;
        
        // Clamp deltaTime to prevent huge jumps (e.g., when returning from inactive tab)
        const clampedDeltaTime = Math.min(deltaTime, 0.1); // Max 100ms per frame
        
        // Increment time continuously
        let newTime = state.currentTime + clampedDeltaTime;
        
        // Loop at end
        if (newTime > state.project.project.duration) {
            newTime = 0;
            // Loop: restart videos at beginning
            controlVideosPlayback(false);
            setTimeout(() => controlVideosPlayback(true), 50);
        }
        
        // Convert to frame and back to snap to frame boundaries
        const currentFrame = timeToFrame(state.currentTime);
        const newFrame = timeToFrame(newTime);
        
        // ALWAYS update time, even if we haven't crossed a frame boundary yet
        // This ensures smooth playback accumulation
        state.currentTime = newTime;
        
        // Only update viewport/playhead when we've moved to a new frame (for performance)
        if (newFrame !== currentFrame) {
            updateViewport();
            updatePlayhead();
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Seek to specific time
 */
export function seekToTime(time) {
    if (!state.project) return;
    
    state.currentTime = Math.max(0, Math.min(state.project.project.duration, time));
    updateViewport();
    updatePlayhead();
    
    // Pause videos when seeking
    if (!state.isPlaying) {
        controlVideosPlayback(false);
    }
}

