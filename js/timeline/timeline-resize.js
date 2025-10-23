/* ============================================
   TIMELINE RESIZE - Draggable timeline height
   ============================================ */

import { getById, updateNotificationContainerPosition } from '../utils/dom.js';
import { updateFloatingToolbarPosition } from '../ui/floating-toolbar-position.js';
import { updateViewport } from '../viewport/viewport.js'; // Add this import

const TIMELINE_HEIGHT_KEY = 'autoexplainer_timeline_height';
const DEFAULT_TIMELINE_HEIGHT = 280;
const MIN_TIMELINE_HEIGHT = 150;
const MAX_TIMELINE_HEIGHT = 600;

let isResizing = false;
let startY = 0;
let startHeight = 0;

/**
 * Setup timeline resize handle
 */
export function setupTimelineResize() {
    const handle = getById('timelineResizeHandle');
    const timelineSection = getById('timelineSection');
    
    if (!handle || !timelineSection) return;
    
    // Restore saved height
    const savedHeight = localStorage.getItem(TIMELINE_HEIGHT_KEY);
    if (savedHeight) {
        const height = parseInt(savedHeight);
        if (height >= MIN_TIMELINE_HEIGHT && height <= MAX_TIMELINE_HEIGHT) {
            timelineSection.style.height = height + 'px';
        }
    }
    
    // Mouse down on handle
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = timelineSection.offsetHeight;
        
        handle.classList.add('resizing');
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    });
    
    // Mouse move
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        // Calculate new height (inverted because we're dragging the top edge)
        const deltaY = startY - e.clientY;
        let newHeight = startHeight + deltaY;
        
        // Clamp to min/max
        newHeight = Math.max(MIN_TIMELINE_HEIGHT, Math.min(MAX_TIMELINE_HEIGHT, newHeight));
        
        // Apply new height
        timelineSection.style.height = newHeight + 'px';
        
        // Update floating toolbar position
        updateFloatingToolbarPosition();
        
        // Update notification position
        updateNotificationContainerPosition();

        // Update viewport elements live during resize
        updateViewport();
        
        e.preventDefault();
    });
    
    // Mouse up
    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        
        isResizing = false;
        handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Save height to localStorage
        const finalHeight = timelineSection.offsetHeight;
        localStorage.setItem(TIMELINE_HEIGHT_KEY, finalHeight.toString());
        
        console.log(`Timeline height saved: ${finalHeight}px`);
    });
}

