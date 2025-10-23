/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { togglePlayback } from '../core/playback.js';
import { updateViewport } from '../viewport/viewport.js';
import { renderTimeline, updateTimelineTransform } from '../timeline/timeline.js';

/**
 * Setup keyboard shortcuts
 */
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Delete/Backspace - delete selected element
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selection.element !== null && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                console.log('Delete element:', state.selection.element);
                // TODO: Implement element deletion
            }
        }
        
        // Escape - deselect
        if (e.key === 'Escape') {
            state.selection.element = null;
            state.selection.block = null;
            getById('animationBtn').style.display = 'none';
            updateViewport();
            renderTimeline();
            updateTimelineTransform();
        }
        
        // Spacebar - toggle playback
        if (e.key === ' ') {
            e.preventDefault();
            togglePlayback();
        }
    });
}

