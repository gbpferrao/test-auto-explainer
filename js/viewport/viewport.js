/* ============================================
   VIEWPORT - Main rendering and setup
   ============================================ */

import { state } from '../state/state.js';
import { getById, clearElement, createElement } from '../utils/dom.js';
import { TIMELINE_COLORS } from '../state/constants.js';
import { createViewportElement } from './viewport-elements.js';
import { setupViewportInteraction } from './viewport-interaction.js';
import { applyKeyframes } from '../keyframes/keyframe-system.js';
import { getAnimationState, applyAnimationTransforms } from '../animation/animation-engine.js';
import { clearSelection } from '../ui/selection-manager.js';

/**
 * Setup viewport
 */
export function setupViewport() {
    if (!state.project) return;
    
    const canvas = getById('viewportCanvas');
    const viewport = getById('viewport');
    
    // Set initial background (updateViewport will adjust based on video presence)
    updateViewportBackground();
    
    viewport.addEventListener('click', (e) => {
        // Deselect when clicking on empty space
        if (e.target === viewport || e.target.id === 'viewportCanvas') {
            clearSelection();
        }
    });
}

/**
 * Update viewport - render all active elements
 */
export function updateViewport() {
    if (!state.project) return;
    
    const canvas = getById('viewportCanvas');
    
    const vp = state.project.project.viewport;
    // Calculate scale based on actual canvas width (responsive)
    const canvasWidth = canvas.offsetWidth || 1280;
    const scale = canvasWidth / vp.width;
    
    // Update background (video or solid color) - ALWAYS do this
    updateViewportBackground();
    updateBackgroundVideo();
    
    // Clear canvas for redraw
    clearElement(canvas);
    
    // Get active timeline items
    const activeItems = state.project.timeline
        .map((item, index) => ({ ...item, _timelineIndex: index }))
        .filter(item => 
            state.currentTime >= item.startTime && 
            state.currentTime <= item.endTime
        );
    
    // Sort by layer
    activeItems.sort((a, b) => a.layer - b.layer);
    
    // Render each active item
    activeItems.forEach(item => {
        // Apply keyframes first
        const keyframedItem = applyKeyframes(item, state.currentTime);
        
        // Calculate animation state
        const animState = getAnimationState(keyframedItem, state.currentTime);
        const { opacity, translateX, translateY, scaleValue, rotationOffset } = 
            applyAnimationTransforms(keyframedItem, animState, scale);
        
        // Create and append element
        const element = createViewportElement(
            keyframedItem, 
            item._timelineIndex, 
            scale, 
            opacity, 
            translateX, 
            translateY, 
            scaleValue,
            rotationOffset || 0
        );
        
        canvas.appendChild(element);
    });
    
    // Only render out-of-frame selection boxes when not playing (for performance)
    if (!state.isPlaying && state.selection.elements && state.selection.elements.length > 0) {
        state.selection.elements.forEach(timelineIndex => {
            const item = state.project.timeline[timelineIndex];
            if (!item) return;
            
            // Check if item is NOT in current timeframe
            const isInFrame = state.currentTime >= item.startTime && state.currentTime <= item.endTime;
            if (isInFrame) return; // Already rendered above
            
            // Create out-of-frame bounding box
            const keyframedItem = applyKeyframes(item, state.currentTime);
            const x = keyframedItem.position.x - (keyframedItem.size.width * keyframedItem.position.anchorX);
            const y = keyframedItem.position.y - (keyframedItem.size.height * keyframedItem.position.anchorY);
            
            const hasMultipleSelected = state.selection.elements.length > 1;
            const classes = ['viewport-out-of-frame'];
            
            if (hasMultipleSelected) {
                classes.push('multi-selected-out-of-frame');
            } else {
                classes.push('selected-out-of-frame');
            }
            
            const outOfFrameBox = createElement('div', {
                classes: classes,
                attributes: { 'data-timeline-index': timelineIndex },
                styles: {
                    position: 'absolute',
                    left: (x * scale) + 'px',
                    top: (y * scale) + 'px',
                    width: (keyframedItem.size.width * scale) + 'px',
                    height: (keyframedItem.size.height * scale) + 'px',
                    transform: `rotate(${keyframedItem.rotation}deg)`,
                    transformOrigin: `${keyframedItem.position.anchorX * 100}% ${keyframedItem.position.anchorY * 100}%`,
                    pointerEvents: 'none',
                    zIndex: 9999
                }
            });
            
            canvas.appendChild(outOfFrameBox);
        });
    }
    
    // Setup interaction
    setupViewportInteraction();
}

/**
 * Update viewport background color (from JSON)
 * Only visible when there's no video background
 */
function updateViewportBackground() {
    if (!state.project) return;
    
    const viewport = getById('viewport');
    
    // Check if there's a video background asset that's actually loaded
    const backgroundVideoAsset = state.project.assets?.find(asset => 
        asset.isBackground && asset.type === 'video'
    );
    
    const hasVideoBackground = backgroundVideoAsset && 
        state.loadedAssets[backgroundVideoAsset.id] instanceof HTMLVideoElement;
    
    if (hasVideoBackground) {
        // Make viewport transparent so video shows through
        viewport.style.background = 'transparent';
    } else {
        // Use solid color from JSON
        const bgColor = state.project.project.backgroundColor || '#ffffff';
        viewport.style.background = bgColor;
    }
    
    // Note: viewport-canvas is always transparent (set in CSS) so viewport background shows through
}

/**
 * Update background video element (simple separate layer)
 */
function updateBackgroundVideo() {
    const bgVideoEl = getById('backgroundVideo');
    if (!bgVideoEl) return;
    
    // Find background video asset
    const backgroundAsset = state.project.assets?.find(asset => asset.isBackground && asset.type === 'video');
    
    if (!backgroundAsset) {
        // No background video, hide the element
        bgVideoEl.style.display = 'none';
        bgVideoEl.src = '';
        return;
    }
    
    const loadedVideo = state.loadedAssets[backgroundAsset.id];
    if (!loadedVideo || !(loadedVideo instanceof HTMLVideoElement)) {
        // Video not loaded yet, hide
        bgVideoEl.style.display = 'none';
        return;
    }
    
    // Set video source if not already set
    if (bgVideoEl.src !== loadedVideo.src) {
        bgVideoEl.src = loadedVideo.src;
    }
    
    // Show the video
    bgVideoEl.style.display = 'block';
    
    // Sync with timeline
    const videoDuration = loadedVideo.duration || 1;
    const targetTime = state.currentTime % videoDuration;
    
    // Only seek if difference is significant (avoid constant seeking)
    if (Math.abs(bgVideoEl.currentTime - targetTime) > 0.1) {
        bgVideoEl.currentTime = targetTime;
    }
    
    // Note: Play/pause is handled by controlVideosPlayback() in playback.js
}

