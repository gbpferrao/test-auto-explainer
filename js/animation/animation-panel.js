/* ============================================
   ANIMATION PANEL - UI for animation controls
   ============================================ */

import { state } from '../state/state.js';
import { getById } from '../utils/dom.js';
import { updateViewport } from '../viewport/viewport.js';
import { getAnimationState, applyAnimationTransforms } from './animation-engine.js';
import { queueProjectSave } from '../core/project-v2.js';

/**
 * Toggle floating panel (animation or text editor)
 */
export function toggleFloatingPanel(panelType) {
    const animWrapper = getById('animationPanelWrapper');
    const textWrapper = getById('textEditorPanelWrapper');
    const animContent = getById('animationPanelContent');
    const textContent = getById('textEditorPanelContent');
    const animBtn = getById('animationToggleBtn');
    const textBtn = getById('textEditorToggleBtn');
    
    if (panelType === 'animation') {
        const isExpanded = animContent.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse animation panel
            animContent.classList.remove('expanded');
            animBtn.classList.remove('active');
            stopAnimationPreview();
        } else {
            // Expand animation panel, collapse text editor
            animContent.classList.add('expanded');
            animBtn.classList.add('active');
            textContent.classList.remove('expanded');
            textBtn.classList.remove('active');
            populateAnimationForm();
            startAnimationPreview();
        }
    } else if (panelType === 'textEditor') {
        const isExpanded = textContent.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse text editor panel
            textContent.classList.remove('expanded');
            textBtn.classList.remove('active');
        } else {
            // Expand text editor, collapse animation panel
            textContent.classList.add('expanded');
            textBtn.classList.add('active');
            animContent.classList.remove('expanded');
            animBtn.classList.remove('active');
            stopAnimationPreview();
            
            // Don't re-populate - already populated by openTextEditor call
        }
    }
}

/**
 * Close all floating panels
 */
export function closeAllFloatingPanels() {
    const animContent = getById('animationPanelContent');
    const textContent = getById('textEditorPanelContent');
    const animBtn = getById('animationToggleBtn');
    const textBtn = getById('textEditorToggleBtn');
    
    if (animContent) animContent.classList.remove('expanded');
    if (textContent) textContent.classList.remove('expanded');
    if (animBtn) animBtn.classList.remove('active');
    if (textBtn) textBtn.classList.remove('active');
    
    stopAnimationPreview();
}

/**
 * Show/hide floating panel wrappers based on selection
 */
export function updateFloatingPanelVisibility() {
    const animWrapper = getById('animationPanelWrapper');
    const textWrapper = getById('textEditorPanelWrapper');
    
    const hasSelection = state.selection.elements && state.selection.elements.length > 0;
    const hasMultipleSelected = state.selection.elements && state.selection.elements.length > 1;
    
    if (hasSelection) {
        // Always show animation button for any element(s)
        if (animWrapper) {
            animWrapper.style.display = 'flex';
        }
        
        // Show text editor button if ALL selected items are text
        if (textWrapper) {
            const allSelectedAreText = state.selection.elements.every(idx => {
                const item = state.project.timeline[idx];
                return item && item.type === 'text';
            });
            
            textWrapper.style.display = allSelectedAreText ? 'flex' : 'none';
        }
    } else {
        // Hide both when nothing is selected
        if (animWrapper) animWrapper.style.display = 'none';
        if (textWrapper) textWrapper.style.display = 'none';
    }
}

/**
 * Populate animation form with current values
 * Shows primary element's values, but applies changes to all selected
 */
function populateAnimationForm() {
    if (!state.selection.elements || state.selection.elements.length === 0) return;
    
    const hasMultiple = state.selection.elements.length > 1;
    const item = state.project.timeline[state.selection.element];
    
    // Update multi-selection label
    const multiLabel = getById('animationPanelMultiLabel');
    if (multiLabel) {
        if (hasMultiple) {
            multiLabel.textContent = `(Editing ${state.selection.elements.length} elements)`;
        } else {
            multiLabel.textContent = '';
        }
    }
    
    // Initialize animation object
    if (!item.animation) {
        item.animation = {
            in: { type: "none", duration: 0.5, easing: "linear" },
            out: { type: "none", duration: 0.5, easing: "linear" },
            loop: { type: "none", cycleDuration: 2.0, minAngle: -5, maxAngle: 5, maxOffset: 3 }
        };
    }
    
    // Ensure loop exists
    if (!item.animation.loop) {
        item.animation.loop = { type: "none", cycleDuration: 2.0, minAngle: -5, maxAngle: 5, maxOffset: 3 };
    }
    
    // Populate form
    getById('animInType').value = item.animation.in.type || "none";
    getById('animInDirection').value = item.animation.in.direction || "left";
    getById('animInDuration').value = item.animation.in.duration || 0.5;
    getById('animInEasing').value = item.animation.in.easing || "linear";
    
    getById('animOutType').value = item.animation.out.type || "none";
    getById('animOutDirection').value = item.animation.out.direction || "left";
    getById('animOutDuration').value = item.animation.out.duration || 0.5;
    getById('animOutEasing').value = item.animation.out.easing || "linear";
    
    getById('animLoopType').value = item.animation.loop.type || "none";
    getById('animLoopCycleDuration').value = item.animation.loop.cycleDuration || 2.0;
    getById('animLoopMinAngle').value = item.animation.loop.minAngle || -5;
    getById('animLoopMaxAngle').value = item.animation.loop.maxAngle || 5;
    getById('animLoopMaxOffset').value = item.animation.loop.maxOffset || 3;
    
    // Show/hide direction controls
    getById('animInDirectionControl').style.display = 
        item.animation.in.type === 'slideIn' ? 'block' : 'none';
    getById('animOutDirectionControl').style.display = 
        item.animation.out.type === 'slideOut' ? 'block' : 'none';
    
    // Show/hide loop controls
    updateLoopControlsVisibility(item.animation.loop.type);
    
    startAnimationPreview();
}

/**
 * Open animation panel (legacy support - for old code)
 */
export function openAnimationPanel() {
    toggleFloatingPanel('animation');
}

/**
 * Close animation panel
 */
export function closeAnimationPanel() {
    const animContent = getById('animationPanelContent');
    const animBtn = getById('animationToggleBtn');
    
    if (animContent) animContent.classList.remove('expanded');
    if (animBtn) animBtn.classList.remove('active');
    stopAnimationPreview();
}

/**
 * Update element animation
 * Applies to ALL selected elements in multi-selection
 */
export function updateElementAnimation(inOut, property, value) {
    if (!state.selection.elements || state.selection.elements.length === 0) return;
    
    // Apply to ALL selected elements
    state.selection.elements.forEach(timelineIndex => {
        const item = state.project.timeline[timelineIndex];
        if (!item) return;
        
        // Initialize animation if needed
    if (!item.animation) {
        item.animation = {
            in: { type: "none", duration: 0.5, easing: "linear" },
                out: { type: "none", duration: 0.5, easing: "linear" },
                loop: { type: "none", cycleDuration: 2.0, minAngle: -5, maxAngle: 5, maxOffset: 3 }
        };
    }
    
    item.animation[inOut][property] = value;
    });
    
    // Show/hide direction controls (based on primary selection)
    if (property === 'type') {
        if (inOut === 'in' || inOut === 'out') {
        const directionControl = getById(`anim${inOut === 'in' ? 'In' : 'Out'}DirectionControl`);
        directionControl.style.display = 
            (value === 'slideIn' || value === 'slideOut') ? 'block' : 'none';
        } else if (inOut === 'loop') {
            updateLoopControlsVisibility(value);
        }
    }
    
    updateViewport();
    queueProjectSave();
}

/**
 * Update loop controls visibility based on type
 */
function updateLoopControlsVisibility(loopType) {
    const controls = getById('animLoopControls');
    const offsetControl = getById('animLoopOffsetControl');
    
    if (loopType === 'none') {
        controls.style.display = 'none';
    } else {
        controls.style.display = 'block';
        offsetControl.style.display = loopType === 'blocky_jitter' ? 'block' : 'none';
    }
}

/**
 * Start animation preview
 */
function startAnimationPreview() {
    stopAnimationPreview();
    
    const box = getById('animPreviewBox');
    let previewTime = 0;
    const previewDuration = 2; // 2 seconds loop
    
    state.animationPreviewInterval = setInterval(() => {
        previewTime = (previewTime + 0.016) % previewDuration; // ~60fps
        
        const item = state.project.timeline[state.selection.element];
        if (!item || !item.animation) return;
        
        // Simulate animation
        const fakeItem = {
            startTime: 0,
            endTime: previewDuration,
            animation: item.animation,
            opacity: 1
        };
        
        const animState = getAnimationState(fakeItem, previewTime);
        const { opacity, translateX, translateY, scaleValue } = applyAnimationTransforms(fakeItem, animState, 1);
        
        box.style.opacity = opacity;
        box.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleValue})`;
    }, 16);
}

/**
 * Stop animation preview
 */
function stopAnimationPreview() {
    if (state.animationPreviewInterval) {
        clearInterval(state.animationPreviewInterval);
        state.animationPreviewInterval = null;
    }
}

// Expose to window for HTML onclick
if (typeof window !== 'undefined') {
    window.toggleFloatingPanel = toggleFloatingPanel;
    window.updateFloatingPanelVisibility = updateFloatingPanelVisibility;
    window.closeAllFloatingPanels = closeAllFloatingPanels;
    window.openAnimationPanel = openAnimationPanel;
    window.closeAnimationPanel = closeAnimationPanel;
    window.updateElementAnimation = updateElementAnimation;
}

// Setup click-outside-to-close handler
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        const animWrapper = document.getElementById('animationPanelWrapper');
        const textWrapper = document.getElementById('textEditorPanelWrapper');
        
        // Check if any panel is expanded
        const animContent = document.getElementById('animationPanelContent');
        const textContent = document.getElementById('textEditorPanelContent');
        const anyExpanded = (animContent && animContent.classList.contains('expanded')) || 
                           (textContent && textContent.classList.contains('expanded'));
        
        if (!anyExpanded) return;
        
        // Check if click is outside both wrappers
        const clickedOutside = !animWrapper?.contains(e.target) && !textWrapper?.contains(e.target);
        
        if (clickedOutside) {
            closeAllFloatingPanels();
        }
    });
}

