/* ============================================
   FLOATING TOOLBAR POSITIONING
   Dynamic vertical centering in viewport space
   ============================================ */

import { getById } from '../utils/dom.js';

/**
 * Update floating toolbar vertical position
 * Centers it in the available viewport space (between topbar and timeline)
 */
export function updateFloatingToolbarPosition() {
    const toolbar = getById('floatingToolbar');
    const topBar = document.querySelector('.top-bar');
    const timelineSection = getById('timelineSection');
    
    if (!toolbar || !topBar || !timelineSection) return;
    
    // Get heights
    const topBarHeight = topBar.offsetHeight;
    const timelineHeight = timelineSection.offsetHeight;
    const windowHeight = window.innerHeight;
    
    // Calculate available viewport space
    const viewportSpaceStart = topBarHeight;
    const viewportSpaceEnd = windowHeight - timelineHeight;
    const viewportSpaceHeight = viewportSpaceEnd - viewportSpaceStart;
    
    // Calculate midpoint
    const midpoint = viewportSpaceStart + (viewportSpaceHeight / 2);
    
    // Apply position
    toolbar.style.top = midpoint + 'px';
    
    // Debug logging (optional)
    // console.log(`Toolbar positioned at ${midpoint}px (viewport: ${viewportSpaceStart}px to ${viewportSpaceEnd}px)`);
}

/**
 * Setup floating toolbar positioning
 * Initializes and sets up listeners for dynamic repositioning
 */
export function setupFloatingToolbarPosition() {
    // Initial position
    updateFloatingToolbarPosition();
    
    // Update on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateFloatingToolbarPosition, 50);
    });
}

