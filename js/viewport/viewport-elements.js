/* ============================================
   VIEWPORT ELEMENTS - Create viewport elements
   ============================================ */

import { state } from '../state/state.js';
import { TIMELINE_COLORS, DEFAULT_TEXT_STYLE } from '../state/constants.js';
import { createElement } from '../utils/dom.js';

/**
 * Create viewport element (image, video, text, or placeholder)
 */
export function createViewportElement(item, timelineIndex, scale, opacity, translateX, translateY, scaleValue, rotationOffset = 0) {
    // Handle text objects separately
    if (item.type === 'text') {
        return createTextElement(item, timelineIndex, scale, opacity, translateX, translateY, scaleValue, rotationOffset);
    }
    
    const asset = state.project.assets.find(a => a.id === item.assetId);
    const assetIndex = state.project.assets.findIndex(a => a.id === item.assetId);
    
    const x = item.position.x - (item.size.width * item.position.anchorX);
    const y = item.position.y - (item.size.height * item.position.anchorY);
    
    // Simple algorithm: check if this element is in selection array
    const isSelected = state.selection.elements && state.selection.elements.includes(timelineIndex);
    const isPrimarySelected = state.selection.element === timelineIndex;
    const hasMultipleSelected = state.selection.elements && state.selection.elements.length > 1;
    
    const classes = [state.loadedAssets[item.assetId] ? 'viewport-element' : 'viewport-placeholder'];
    
    // Apply selection classes based on simple rules
    if (isSelected) {
        if (hasMultipleSelected) {
            // Multiple items selected - show orange outline
            classes.push('multi-selected');
        } else {
            // Single item selected - show blue outline
            classes.push('selected');
        }
    }
    
    const el = createElement('div', {
        classes: classes,
        attributes: { 'data-timeline-index': timelineIndex },
        styles: {
            left: (x * scale) + 'px',
            top: (y * scale) + 'px',
            width: (item.size.width * scale) + 'px',
            height: (item.size.height * scale) + 'px',
            opacity: opacity,
            transform: `translate(${translateX * scale}px, ${translateY * scale}px) scale(${scaleValue}) rotate(${item.rotation + rotationOffset}deg)`,
            transformOrigin: `${item.position.anchorX * 100}% ${item.position.anchorY * 100}%`,
            zIndex: item.layer
        }
    });
    
    // Add content (image, video, or placeholder)
    if (state.loadedAssets[item.assetId]) {
        const loadedAsset = state.loadedAssets[item.assetId];
        
        // Check if it's a video element
        if (loadedAsset instanceof HTMLVideoElement) {
            // Clone video element for viewport
            const videoClone = document.createElement('video');
            videoClone.src = loadedAsset.src;
            videoClone.muted = true;
            videoClone.playsInline = true;
            videoClone.loop = loadedAsset.loop;
            videoClone.style.cssText = 'width: 100%; height: 100%; object-fit: contain; pointer-events: none;';
            
            // Sync video time with timeline
            const relativeTime = state.currentTime - item.startTime;
            const videoDuration = loadedAsset.duration || 1;
            videoClone.currentTime = loadedAsset.loop ? (relativeTime % videoDuration) : Math.min(relativeTime, videoDuration);
            
            el.appendChild(videoClone);
        } else {
            // Regular image
            el.innerHTML = `<img src="${loadedAsset.src}" alt="${item.assetId}" draggable="false">`;
        }
    } else {
        el.style.borderColor = TIMELINE_COLORS[assetIndex % TIMELINE_COLORS.length];
        el.innerHTML = `<div class="placeholder-label" style="color: ${TIMELINE_COLORS[assetIndex % TIMELINE_COLORS.length]}">${item.assetId}</div>`;
    }
    
    // Add handles ONLY for single selection (no handles in multi-selection)
    if (isPrimarySelected && !hasMultipleSelected) {
        addElementHandles(el, item);
    }
    
    return el;
}

/**
 * Create text element for viewport
 */
function createTextElement(item, timelineIndex, scale, opacity, translateX, translateY, scaleValue, rotationOffset = 0) {
    const x = item.position.x - (item.size.width * item.position.anchorX);
    const y = item.position.y - (item.size.height * item.position.anchorY);
    
    // Simple algorithm: check if this element is in selection array
    const isSelected = state.selection.elements && state.selection.elements.includes(timelineIndex);
    const isPrimarySelected = state.selection.element === timelineIndex;
    const hasMultipleSelected = state.selection.elements && state.selection.elements.length > 1;
    
    const classes = ['viewport-element', 'viewport-text'];
    
    // Apply selection classes based on simple rules
    if (isSelected) {
        if (hasMultipleSelected) {
            // Multiple items selected - show orange outline
            classes.push('multi-selected');
        } else {
            // Single item selected - show blue outline
            classes.push('selected');
        }
    }
    
    const style = { ...DEFAULT_TEXT_STYLE, ...item.style };
    const textContent = item.text || 'Double-click to edit';
    
    const el = createElement('div', {
        classes: classes,
        attributes: { 'data-timeline-index': timelineIndex },
        styles: {
            left: (x * scale) + 'px',
            top: (y * scale) + 'px',
            width: (item.size.width * scale) + 'px',
            height: (item.size.height * scale) + 'px',
            opacity: opacity,
            transform: `translate(${translateX * scale}px, ${translateY * scale}px) scale(${scaleValue}) rotate(${item.rotation + rotationOffset}deg)`,
            transformOrigin: `${item.position.anchorX * 100}% ${item.position.anchorY * 100}%`,
            zIndex: item.layer,
            fontFamily: style.fontFamily,
            fontSize: (style.fontSize * scale) + 'px',
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            color: style.color,
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            letterSpacing: (style.letterSpacing * scale) + 'px',
            textDecoration: style.textDecoration,
            textShadow: style.textShadow,
            backgroundColor: style.backgroundColor,
            padding: (style.padding * scale) + 'px',
            borderRadius: (style.borderRadius * scale) + 'px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'visible',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            cursor: 'move'
        }
    });
    
    el.textContent = textContent;
    
    // Add handles ONLY for single selection (no handles in multi-selection)
    // This is handled by viewport-interaction.js after element creation
    // if (isPrimarySelected && !hasMultipleSelected) {
    //     addElementHandles(el, item);
    // }
    
    // Note: Double-click handler is set up via event delegation in viewport-interaction.js
    
    return el;
}

/**
 * Add resize and rotation handles to selected element
 */
function addElementHandles(el, item) {
    // Resize handles
    const corners = ['nw', 'ne', 'sw', 'se'];
    corners.forEach(corner => {
        const handle = createElement('div', {
            classes: `element-resize-handle ${corner}`,
            attributes: { 'data-corner': corner }
        });
        el.appendChild(handle);
    });
    
    // Rotation handle
    const rotateHandle = createElement('div', {
        classes: 'element-rotate-handle'
    });
    el.appendChild(rotateHandle);
    
    // Info display
    const info = createElement('div', {
        classes: 'element-info',
        textContent: `${Math.round(item.size.width)}x${Math.round(item.size.height)} @ ${Math.round(item.position.x)},${Math.round(item.position.y)} | ${Math.round(item.rotation)}°`
    });
    el.appendChild(info);
}

