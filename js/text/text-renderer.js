/* ============================================
   TEXT RENDERER - Render text objects in viewport
   ============================================ */

import { state } from '../state/state.js';
import { DEFAULT_TEXT_STYLE } from '../state/constants.js';

/**
 * Create text element for viewport
 * @param {object} item - Timeline item with text content
 * @param {object} keyframedItem - Item with keyframes applied
 * @param {number} scale - Viewport scale
 * @returns {HTMLElement} Text element
 */
export function createTextElement(item, keyframedItem, scale) {
    const textContent = item.text || 'Double-click to edit';
    const style = { ...DEFAULT_TEXT_STYLE, ...item.style };
    
    const textEl = document.createElement('div');
    textEl.className = 'viewport-text';
    textEl.dataset.timelineIndex = item._timelineIndex;
    textEl.textContent = textContent;
    
    // Apply text styles
    textEl.style.cssText = `
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize * scale}px;
        font-weight: ${style.fontWeight};
        font-style: ${style.fontStyle};
        color: ${style.color};
        text-align: ${style.textAlign};
        line-height: ${style.lineHeight};
        letter-spacing: ${style.letterSpacing}px;
        text-decoration: ${style.textDecoration};
        text-shadow: ${style.textShadow};
        background-color: ${style.backgroundColor};
        padding: ${style.padding * scale}px;
        border-radius: ${style.borderRadius * scale}px;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow: hidden;
        box-sizing: border-box;
        user-select: none;
    `;
    
    return textEl;
}

/**
 * Calculate text dimensions (for auto-sizing)
 * @param {string} text - Text content
 * @param {object} style - Text style
 * @param {number} maxWidth - Maximum width
 * @returns {object} {width, height}
 */
export function calculateTextDimensions(text, style, maxWidth = 1280) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    
    const lines = text.split('\n');
    let width = 0;
    
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        width = Math.max(width, metrics.width);
    });
    
    const lineHeight = style.fontSize * style.lineHeight;
    const height = lines.length * lineHeight + (style.padding * 2);
    width = Math.min(width + (style.padding * 2), maxWidth);
    
    return { width: Math.ceil(width), height: Math.ceil(height) };
}

