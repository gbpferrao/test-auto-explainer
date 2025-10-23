/* ============================================
   VIEWPORT INTERACTION - Drag, Resize, Rotate
   ============================================ */

import { state } from '../state/state.js';
import { getById, createElement } from '../utils/dom.js';
import { MIN_ELEMENT_SIZE } from '../state/constants.js';
import { updateViewport } from './viewport.js';
import { addKeyframeAtCurrentTime, deltaAllKeyframes } from '../keyframes/keyframe-ui.js';
import { applyKeyframes } from '../keyframes/keyframe-system.js';
import { queueProjectSave } from '../core/project-v2.js';
import { recordChange } from '../core/history.js';
import { selectElement, getSelectedElements, clearSelection } from '../ui/selection-manager.js';
import { rotatePoint } from '../utils/math.js'; // Add this import

/**
 * Add resize and rotation handles to an element
 */
function addHandlesToElement(el) {
    // Remove existing handles first
    el.querySelectorAll('.element-resize-handle, .element-rotate-handle, .element-info').forEach(h => h.remove());
    
    // Get item data for info display
    const timelineIndex = parseInt(el.dataset.timelineIndex);
    const item = state.project.timeline[timelineIndex];
    if (!item) return;
    
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

    // Center indicator
    const centerIndicator = createElement('div', {
        classes: 'element-center-indicator',
        styles: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: '10000' // Above other handles
        }
    });
    el.appendChild(centerIndicator);
}

/**
 * Update selection highlighting without recreating elements
 * This is crucial for maintaining mouse event chain during drag initialization
 */
function updateSelectionOnly(addHandles = false) {
    const canvas = getById('viewportCanvas');
    const allElements = canvas.querySelectorAll('.viewport-element, .viewport-placeholder');
    
    const hasMultipleSelected = state.selection.elements && state.selection.elements.length > 1;
    
    allElements.forEach(el => {
        const timelineIndex = parseInt(el.dataset.timelineIndex);
        const isInSelection = state.selection.elements && state.selection.elements.includes(timelineIndex);
        const isPrimary = state.selection.element === timelineIndex;
        
        // Remove all selection classes first
        el.classList.remove('selected', 'multi-selected');
        
        // Apply correct selection classes
        if (isInSelection) {
            if (hasMultipleSelected) {
                el.classList.add('multi-selected');
            } else {
            el.classList.add('selected');
            }
            
            // Add handles only for single selection primary
            if (addHandles && isPrimary && !hasMultipleSelected) {
                addHandlesToElement(el);
            } else {
                // Remove handles from multi-selected elements
                el.querySelectorAll('.element-resize-handle, .element-rotate-handle, .element-info').forEach(h => h.remove());
            }
        } else {
            // Remove handles from unselected elements
            el.querySelectorAll('.element-resize-handle, .element-rotate-handle, .element-info').forEach(h => h.remove());
        }
    });
}

/**
 * Update property value, considering keyframes at current time
 * This allows smooth editing even when keyframes exist
 */
function updatePropertyWithKeyframe(item, property, value) {
    // Always update base value
    if (property === 'position') {
        item.position.x = value.x;
        item.position.y = value.y;
    } else if (property === 'size') {
        item.size.width = value.width;
        item.size.height = value.height;
    } else if (property === 'rotation') {
        item.rotation = value;
    } else if (property === 'opacity') {
        item.opacity = value;
    }
    
    // If keyframes exist for this property, we MUST update/create a keyframe
    // Otherwise the keyframe interpolation will override our changes during drag
    if (item.keyframes && item.keyframes[property]) {
        const existing = item.keyframes[property].findIndex(
            kf => Math.abs(kf.time - state.currentTime) < 0.01
        );
        
        if (existing >= 0) {
            // Update existing keyframe at current time
            item.keyframes[property][existing].value = value;
        } else {
            // Create new keyframe at current time to make drag visible
            // (When dragging between 2+ keyframes, interpolation would override base value)
            item.keyframes[property].push({
                time: state.currentTime,
                value: value,
                easing: 'linear'
            });
            // Sort by time
            item.keyframes[property].sort((a, b) => a.time - b.time);
        }
    }
}

/**
 * Setup viewport interaction (once on init)
 */
let interactionSetup = false;

export function setupViewportInteraction() {
    if (interactionSetup) return; // Only setup once
    
    const canvas = getById('viewportCanvas');
    const viewport = getById('viewport');
    const viewportContainer = document.querySelector('.viewport-container'); // Parent container
    
    // Prevent all default drag behavior
    canvas.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Use event delegation for mousedown (elements are recreated often)
    canvas.addEventListener('mousedown', (e) => {
        const element = e.target.closest('.viewport-element, .viewport-placeholder');
        
        if (element) {
            handleElementMouseDown(e, element);
        }
        // Clicking empty space deselects (unless holding shift)
        else if (!e.shiftKey) {
            clearSelection();
        }
    });
    
    // Click on viewport container (gray area around canvas) also deselects
    if (viewportContainer) {
        viewportContainer.addEventListener('mousedown', (e) => {
            // Only if clicking directly on container or viewport header, not on viewport/canvas itself
            if ((e.target === viewportContainer || e.target.classList.contains('viewport-header')) && !e.shiftKey) {
                clearSelection();
            }
        });
    }
    
    // Use event delegation for double-click on text elements
    canvas.addEventListener('dblclick', (e) => {
        const element = e.target.closest('.viewport-text');
        if (element && window.openTextEditor) {
            e.stopPropagation();
            const timelineIndex = parseInt(element.dataset.timelineIndex);
            window.openTextEditor(timelineIndex);
        }
    });
    
    interactionSetup = true;
}

/**
 * Handle element mouse down
 */
function handleElementMouseDown(e, element) {
    if (!state.project || state.isPlaying) return;
    
    const resizeHandle = e.target.closest('.element-resize-handle');
    const rotateHandle = e.target.closest('.element-rotate-handle');
    const timelineIndex = parseInt(element.dataset.timelineIndex);
    
    // Handle rotation
    if (rotateHandle) {
        e.stopPropagation();
        startRotation(timelineIndex, e);
        return;
    }
    
    // Handle resize
    if (resizeHandle) {
        e.stopPropagation();
        startResize(timelineIndex, resizeHandle.dataset.corner, e);
        return;
    }
    
    // Handle drag
    e.stopPropagation();
    startDrag(timelineIndex, e, element); // Pass the element directly
    element.classList.add('dragging');
}

/**
 * Start dragging element
 */
function startDrag(timelineIndex, e, element) {
    const wasAlreadySelected = state.selection.elements.includes(timelineIndex);
    
    // Check if Ctrl is held for delta mode
    state.interaction.isCtrlHeld = e.ctrlKey;
    state.interaction.deltaMode = e.ctrlKey;
    
    // If already selected, start dragging immediately; otherwise wait for mousemove
    if (wasAlreadySelected) {
        state.interaction.isDraggingElement = true;
    } else {
        state.interaction.isDraggingStarted = true;
    }
    
    // Use centralized selection system - add to selection if shift is held
    selectElement(timelineIndex, 'viewport', false, e.shiftKey);
    
    state.interaction.elementDragStartX = e.clientX;
    state.interaction.elementDragStartY = e.clientY;

    // Calculate actual scale based on current canvas width
    const canvas = getById('viewportCanvas');
    const vp = state.project.project.viewport;
    const canvasWidth = canvas.offsetWidth || 1280;
    const scale = canvasWidth / vp.width;

    // Store initial mouse offset relative to element's top-left corner
    const keyframedItem = applyKeyframes(state.project.timeline[timelineIndex], state.currentTime);
    // Use the passed 'element' directly, not a re-queried one
    const elementRect = element.getBoundingClientRect();
    state.interaction.initialMouseOffsetX = (e.clientX - elementRect.left) / scale;
    state.interaction.initialMouseOffsetY = (e.clientY - elementRect.top) / scale;

    // Store initial positions for all selected elements
    const selectedElements = getSelectedElements();
    state.interaction.multiElementInitialPositions = selectedElements.map(idx => {
        const item = state.project.timeline[idx];
        const keyframedItem = applyKeyframes(item, state.currentTime);
        return {
            index: idx,
            x: keyframedItem.position.x,
            y: keyframedItem.position.y
        };
    });
    
    document.addEventListener('mousemove', handleElementMouseMove);
    document.addEventListener('mouseup', handleElementMouseUp);
    
    // Update selection styling without recreating elements (crucial for mouse event chain)
    if (!wasAlreadySelected) {
        updateSelectionOnly();
        // Don't call updateViewport here - will be called in mouseup if it was just a click
    }
}

/**
 * Start resizing element
 */
function startResize(timelineIndex, corner, e) {
    const wasAlreadySelected = state.selection.element === timelineIndex;
    
    // Check if Ctrl is held for delta mode
    state.interaction.isCtrlHeld = e.ctrlKey;
    state.interaction.deltaMode = e.ctrlKey;
    
    // If already selected, start resizing immediately; otherwise wait for mousemove
    if (wasAlreadySelected) {
        state.interaction.isResizingElement = true;
    } else {
        state.interaction.isResizeStarted = true;
    }
    
    state.interaction.resizeCorner = corner;
    
    // Use centralized selection system
    selectElement(timelineIndex, 'viewport', false);

    // Calculate actual scale based on current canvas width
    const canvas = getById('viewportCanvas');
    const vp = state.project.project.viewport;
    const canvasWidth = canvas.offsetWidth || 1280;
    const scale = canvasWidth / vp.width;
    
    state.interaction.elementDragStartX = e.clientX;
    state.interaction.elementDragStartY = e.clientY;
    
    const item = state.project.timeline[timelineIndex];
    const keyframedItem = applyKeyframes(item, state.currentTime);
    state.interaction.elementInitialWidth = keyframedItem.size.width;
    state.interaction.elementInitialHeight = keyframedItem.size.height;
    state.interaction.elementInitialX = keyframedItem.position.x;
    state.interaction.elementInitialY = keyframedItem.position.y;
    state.interaction.elementInitialAnchorX = keyframedItem.position.anchorX;
    state.interaction.elementInitialAnchorY = keyframedItem.position.anchorY;
    
    // Calculate initial visual top-left corner for accurate resize
    state.interaction.elementInitialVisualX = keyframedItem.position.x - (keyframedItem.size.width * keyframedItem.position.anchorX);
    state.interaction.elementInitialVisualY = keyframedItem.position.y - (keyframedItem.size.height * keyframedItem.position.anchorY);

    // Store element's true visual center and rotation for accurate resize with rotation
    state.interaction.elementCenterX = state.interaction.elementInitialVisualX + (keyframedItem.size.width / 2);
    state.interaction.elementCenterY = state.interaction.elementInitialVisualY + (keyframedItem.size.height / 2);
    state.interaction.elementRotation = keyframedItem.rotation || 0;

    // Get mouse position relative to canvas
    const canvasRect = getById('viewportCanvas').getBoundingClientRect();
    const mouseCanvasX = (e.clientX - canvasRect.left) / scale;
    const mouseCanvasY = (e.clientY - canvasRect.top) / scale;

    // Rotate initial mouse to element's local space
    const rotatedInitialMouse = rotatePoint(mouseCanvasX, mouseCanvasY, state.interaction.elementCenterX, state.interaction.elementCenterY, -state.interaction.elementRotation);

    // Calculate the ideal local corner position at the start of resize
    let idealLocalCornerX, idealLocalCornerY;
    const initialHalfWidth = keyframedItem.size.width / 2;
    const initialHalfHeight = keyframedItem.size.height / 2;

    if (corner === 'se') {
        idealLocalCornerX = initialHalfWidth;
        idealLocalCornerY = initialHalfHeight;
    } else if (corner === 'sw') {
        idealLocalCornerX = -initialHalfWidth;
        idealLocalCornerY = initialHalfHeight;
    } else if (corner === 'ne') {
        idealLocalCornerX = initialHalfWidth;
        idealLocalCornerY = -initialHalfHeight;
    } else if (corner === 'nw') {
        idealLocalCornerX = -initialHalfWidth;
        idealLocalCornerY = -initialHalfHeight;
    }

    // Store the offset from the ideal local corner to the actual initial local mouse position
    state.interaction.initialLocalMouseOffsetXFromCorner = rotatedInitialMouse.x - (state.interaction.elementCenterX + idealLocalCornerX);
    state.interaction.initialLocalMouseOffsetYFromCorner = rotatedInitialMouse.y - (state.interaction.elementCenterY + idealLocalCornerY);

    document.addEventListener('mousemove', handleElementMouseMove);
    document.addEventListener('mouseup', handleElementMouseUp);
    
    // Update selection styling without recreating elements
    if (!wasAlreadySelected) {
        updateSelectionOnly();
        // Don't call updateViewport here - will be called in mouseup if it was just a click
    }
}

/**
 * Start rotating element
 */
function startRotation(timelineIndex, e) {
    const wasAlreadySelected = state.selection.element === timelineIndex;
    
    // Check if Ctrl is held for delta mode
    state.interaction.isCtrlHeld = e.ctrlKey;
    state.interaction.deltaMode = e.ctrlKey;
    
    // If already selected, start rotating immediately; otherwise wait for mousemove
    if (wasAlreadySelected) {
        state.interaction.isRotatingElement = true;
    } else {
        state.interaction.isRotateStarted = true;
    }
    
    // Use centralized selection system
    selectElement(timelineIndex, 'viewport', false);
    
    const item = state.project.timeline[timelineIndex];
    const keyframedItem = applyKeyframes(item, state.currentTime);

    // Calculate the true visual center of the element
    // item.position.x/y is the anchor point. We need to find the center of the bounding box.
    const visualLeft = keyframedItem.position.x - (keyframedItem.size.width * keyframedItem.position.anchorX);
    const visualTop = keyframedItem.position.y - (keyframedItem.size.height * keyframedItem.position.anchorY);
    
    state.interaction.rotationCenterX = visualLeft + (keyframedItem.size.width / 2);
    state.interaction.rotationCenterY = visualTop + (keyframedItem.size.height / 2);

    state.interaction.elementDragStartX = e.clientX;
    state.interaction.elementDragStartY = e.clientY;
    state.interaction.elementInitialRotation = keyframedItem.rotation || 0;
    
    document.addEventListener('mousemove', handleElementMouseMove);
    document.addEventListener('mouseup', handleElementMouseUp);
    
    // Update selection styling without recreating elements
    if (!wasAlreadySelected) {
        updateSelectionOnly();
        // Don't call updateViewport here - will be called in mouseup if it was just a click
    }
}

/**
 * Handle element mouse move
 */
function handleElementMouseMove(e) {
    if (!state.project) return;
    
    // CRITICAL: Check flags from state directly, not destructured copy
    // Calculate actual scale based on current canvas width (accounts for fullscreen)
    const canvas = getById('viewportCanvas');
    const vp = state.project.project.viewport;
    const canvasWidth = canvas.offsetWidth || 1280;
    const scale = canvasWidth / vp.width;
    
    // If already dragging, skip threshold checks
    if (state.interaction.isDraggingElement) {
        const item = state.project.timeline[state.selection.element];
        handleDrag(e, item, vp, scale);
        updateViewport();
        return;
    }
    
    if (state.interaction.isResizingElement) {
        const item = state.project.timeline[state.selection.element];
        handleResize(e, item, scale);
        updateViewport();
        return;
    }
    
    if (state.interaction.isRotatingElement) {
        const item = state.project.timeline[state.selection.element];
        handleRotation(e, item, scale);
        updateViewport();
        return;
    }
    
    // Check if we need to transition from "started" to "active" for resize
    if (state.interaction.isResizeStarted) {
        const dx = Math.abs(e.clientX - state.interaction.elementDragStartX);
        const dy = Math.abs(e.clientY - state.interaction.elementDragStartY);
        if (dx > 2 || dy > 2) { // 2px threshold to filter clicks
            state.interaction.isResizingElement = true;
            state.interaction.isResizeStarted = false;
            // Now handle resize
            const item = state.project.timeline[state.selection.element];
            handleResize(e, item, scale);
            updateViewport();
        }
        return;
    }
    
    // Check if we need to transition from "started" to "active" for rotation
    if (state.interaction.isRotateStarted) {
        const dx = Math.abs(e.clientX - state.interaction.elementDragStartX);
        const dy = Math.abs(e.clientY - state.interaction.elementDragStartY);
        if (dx > 2 || dy > 2) { // 2px threshold to filter clicks
            state.interaction.isRotatingElement = true;
            state.interaction.isRotateStarted = false;
            // Now handle rotation
            const item = state.project.timeline[state.selection.element];
            handleRotation(e, item, scale);
            updateViewport();
        }
        return;
    }
    
    // Check if we need to transition from "started" to "active" for drag
    if (state.interaction.isDraggingStarted) {
        const dx = Math.abs(e.clientX - state.interaction.elementDragStartX);
        const dy = Math.abs(e.clientY - state.interaction.elementDragStartY);
        if (dx > 2 || dy > 2) { // 2px threshold to filter clicks
            state.interaction.isDraggingElement = true;
            state.interaction.isDraggingStarted = false;
            // Now handle drag
            const item = state.project.timeline[state.selection.element];
            handleDrag(e, item, vp, scale);
            updateViewport();
        }
        return;
    }
}

/**
 * Handle rotation movement
 */
function handleRotation(e, item, scale) {
    const rect = getById('viewportCanvas').getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const startX = state.interaction.elementDragStartX - rect.left;
    const startY = state.interaction.elementDragStartY - rect.top;

    // Convert stored project-space rotation center to canvas-relative coordinates
    const rotationCenterCanvasX = state.interaction.rotationCenterX * scale;
    const rotationCenterCanvasY = state.interaction.rotationCenterY * scale;

    const startAngle = Math.atan2(
        startY - rotationCenterCanvasY,
        startX - rotationCenterCanvasX
    );
    const currentAngle = Math.atan2(
        currentY - rotationCenterCanvasY,
        currentX - rotationCenterCanvasX
    );
    
    let deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
    
    if (state.interaction.deltaMode) {
        // Delta mode: offset all rotation keyframes by the delta
        if (!state.interaction.lastDeltaRotation) {
            state.interaction.lastDeltaRotation = 0;
        }
        
        const incrementalDeltaAngle = deltaAngle - state.interaction.lastDeltaRotation;
        
        deltaAllKeyframes(state.selection.element, 'rotation', incrementalDeltaAngle);
        
        state.interaction.lastDeltaRotation = deltaAngle;
    } else {
        // Normal mode: update rotation at current time
    let newRotation = (state.interaction.elementInitialRotation + deltaAngle) % 360;
    if (newRotation < 0) newRotation += 360;
    
    // Update rotation with keyframe support
    updatePropertyWithKeyframe(item, 'rotation', newRotation);
    }
}

/**
 * Handle drag movement (supports multi-selection)
 */
function handleDrag(e, item, vp, scale) {
    const dx = (e.clientX - state.interaction.elementDragStartX) / scale;
    const dy = (e.clientY - state.interaction.elementDragStartY) / scale;
    
    const selectedElements = getSelectedElements();
    
    if (state.interaction.deltaMode) {
        // Delta mode: offset all keyframes for all selected elements
        if (!state.interaction.lastDeltaX) {
            state.interaction.lastDeltaX = 0;
            state.interaction.lastDeltaY = 0;
        }
        
        const incrementalDx = dx - state.interaction.lastDeltaX;
        const incrementalDy = dy - state.interaction.lastDeltaY;
        
        // Apply to all selected elements
        selectedElements.forEach(idx => {
            deltaAllKeyframes(idx, 'position', { 
                x: incrementalDx, 
                y: incrementalDy 
            });
        });
        
        state.interaction.lastDeltaX = dx;
        state.interaction.lastDeltaY = dy;
    } else {
        // Normal mode: update position at current time for all selected elements
        selectedElements.forEach((idx, i) => {
            const elementItem = state.project.timeline[idx];
            const initialPos = state.interaction.multiElementInitialPositions[i];
            
            // Simply add the total mouse movement delta (dx, dy) to the initial anchor position
            let newX = initialPos.x + dx;
            let newY = initialPos.y + dy;

            // No viewport bounds clamping - allow elements to overflow viewport

            // Update position (base value or current keyframe)
            updatePropertyWithKeyframe(elementItem, 'position', { x: newX, y: newY });
        });
    }
}

/**
 * Handle resize movement
 */
function handleResize(e, item, scale) {
    const dx = (e.clientX - state.interaction.elementDragStartX) / scale;
    const dy = (e.clientY - state.interaction.elementDragStartY) / scale;
    
    const corner = state.interaction.resizeCorner;
    
    if (state.interaction.deltaMode) {
        // Delta mode: offset all size keyframes by the delta
        if (!state.interaction.lastDeltaWidth) {
            state.interaction.lastDeltaWidth = 0;
            state.interaction.lastDeltaHeight = 0;
            state.interaction.lastDeltaX = 0;
            state.interaction.lastDeltaY = 0;
        }
        
        let deltaWidth = 0;
        let deltaHeight = 0;
        let deltaPosX = 0;
        let deltaPosY = 0;
        
        if (corner === 'se') {
            deltaWidth = dx - state.interaction.lastDeltaWidth;
            deltaHeight = dy - state.interaction.lastDeltaHeight;
        } else if (corner === 'sw') {
            deltaWidth = -(dx - state.interaction.lastDeltaWidth);
            deltaHeight = dy - state.interaction.lastDeltaHeight;
            deltaPosX = dx - state.interaction.lastDeltaX;
        } else if (corner === 'ne') {
            deltaWidth = dx - state.interaction.lastDeltaWidth;
            deltaHeight = -(dy - state.interaction.lastDeltaHeight);
            deltaPosY = dy - state.interaction.lastDeltaY;
        } else if (corner === 'nw') {
            deltaWidth = -(dx - state.interaction.lastDeltaWidth);
            deltaHeight = -(dy - state.interaction.lastDeltaHeight);
            deltaPosX = dx - state.interaction.lastDeltaX;
            deltaPosY = dy - state.interaction.lastDeltaY;
        }
        
        deltaAllKeyframes(state.selection.element, 'size', { 
            width: deltaWidth, 
            height: deltaHeight 
        });
        
        if (deltaPosX !== 0 || deltaPosY !== 0) {
            deltaAllKeyframes(state.selection.element, 'position', { 
                x: deltaPosX, 
                y: deltaPosY 
            });
        }
        
        state.interaction.lastDeltaWidth = dx;
        state.interaction.lastDeltaHeight = dy;
        state.interaction.lastDeltaX = dx;
        state.interaction.lastDeltaY = dy;
    } else {
        // Normal mode: update size at current time, pivoting around the element's center
        const itemRotation = state.interaction.elementRotation;
        const centerX = state.interaction.elementCenterX;
        const centerY = state.interaction.elementCenterY;
        const anchorX = state.interaction.elementInitialAnchorX;
        const anchorY = state.interaction.elementInitialAnchorY;

        // Define initial half-width and half-height for center-based scaling
        const initialHalfWidth = state.interaction.elementInitialWidth / 2;
        const initialHalfHeight = state.interaction.elementInitialHeight / 2;

        // Get mouse in canvas space
        const rect = getById('viewportCanvas').getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / scale;
        const mouseY = (e.clientY - rect.top) / scale;

        // Rotate mouse to element's local space (inverse rotation)
        const rotatedMouse = rotatePoint(mouseX, mouseY, centerX, centerY, -itemRotation);

        // Apply the 'grip offset' to the rotated mouse position to get the target corner position
        const targetLocalCornerX = rotatedMouse.x - state.interaction.initialLocalMouseOffsetXFromCorner;
        const targetLocalCornerY = rotatedMouse.y - state.interaction.initialLocalMouseOffsetYFromCorner;

        let newWidth;
        let newHeight;

        // Calculate new half-widths/heights from center based on which corner is dragged
        // Then adjust newVisualX/Y to maintain the center pivot
        if (corner === 'se') {
            newWidth = Math.max(MIN_ELEMENT_SIZE / 2, targetLocalCornerX - centerX) * 2;
            newHeight = Math.max(MIN_ELEMENT_SIZE / 2, targetLocalCornerY - centerY) * 2;
        } else if (corner === 'sw') {
            newWidth = Math.max(MIN_ELEMENT_SIZE / 2, centerX - targetLocalCornerX) * 2;
            newHeight = Math.max(MIN_ELEMENT_SIZE / 2, targetLocalCornerY - centerY) * 2;
        } else if (corner === 'ne') {
            newWidth = Math.max(MIN_ELEMENT_SIZE / 2, targetLocalCornerX - centerX) * 2;
            newHeight = Math.max(MIN_ELEMENT_SIZE / 2, centerY - targetLocalCornerY) * 2;
        } else if (corner === 'nw') {
            newWidth = Math.max(MIN_ELEMENT_SIZE / 2, centerX - targetLocalCornerX) * 2;
            newHeight = Math.max(MIN_ELEMENT_SIZE / 2, centerY - targetLocalCornerY) * 2;
        }

        // Calculate the new visual top-left coordinates to keep the center fixed
        const newVisualX = centerX - (newWidth / 2);
        const newVisualY = centerY - (newHeight / 2);

        // Convert new visual top-left back to anchor-based position
        const newX = newVisualX + (newWidth * anchorX);
        const newY = newVisualY + (newHeight * anchorY);
        
        // Update size and position with keyframe support
        updatePropertyWithKeyframe(item, 'size', { width: newWidth, height: newHeight });
        if (newX !== item.position.x || newY !== item.position.y) {
            updatePropertyWithKeyframe(item, 'position', { x: newX, y: newY });
        }
    }
}

/**
 * Handle element mouse up
 */
function handleElementMouseUp(e) {
    const { isDraggingElement, isResizingElement, isRotatingElement, isDraggingStarted, isResizeStarted, isRotateStarted, deltaMode } = state.interaction;
    
    // Only save if we actually performed an action (not just a click)
    if (isDraggingElement || isResizingElement || isRotatingElement) {
        const selectedElements = getSelectedElements();
        const count = selectedElements.length;
        
        if (count > 0) {
            if (deltaMode) {
                // Delta mode: we've already updated all keyframes, just record change
                const suffix = count > 1 ? `${count} elements` : (state.project.timeline[selectedElements[0]].assetId || 'element');
                if (isDraggingElement) {
                    recordChange(`Delta moved ${suffix}`);
                }
                if (isResizingElement) {
                    recordChange(`Delta resized ${suffix}`);
                }
                if (isRotatingElement) {
                    recordChange(`Delta rotated ${suffix}`);
                }
            } else {
                // Normal mode: auto-insert keyframe at current time for all selected
            if (isDraggingElement) {
                    selectedElements.forEach(idx => addKeyframeAtCurrentTime(idx, 'position'));
                    const suffix = count > 1 ? `${count} elements` : (state.project.timeline[selectedElements[0]].assetId || 'element');
                    recordChange(`Moved ${suffix}`);
            }
            if (isResizingElement) {
                addKeyframeAtCurrentTime(state.selection.element, 'size');
                const assetId = state.project.timeline[state.selection.element]?.assetId || 'element';
                recordChange(`Resized ${assetId}`);
            }
            if (isRotatingElement) {
                addKeyframeAtCurrentTime(state.selection.element, 'rotation');
                const assetId = state.project.timeline[state.selection.element]?.assetId || 'element';
                recordChange(`Rotated ${assetId}`);
                }
            }
        }
        
        // Clear interaction state
        state.interaction.isDraggingElement = false;
        state.interaction.isResizingElement = false;
        state.interaction.isRotatingElement = false;
        state.interaction.resizeCorner = null;
        state.interaction.deltaMode = false;
        state.interaction.isCtrlHeld = false;
        state.interaction.lastDeltaX = 0;
        state.interaction.lastDeltaY = 0;
        state.interaction.lastDeltaWidth = 0;
        state.interaction.lastDeltaHeight = 0;
        state.interaction.lastDeltaRotation = 0;
        state.interaction.elementInitialAnchorX = 0;
        state.interaction.elementInitialAnchorY = 0;
        state.interaction.elementInitialVisualX = 0;
        state.interaction.elementInitialVisualY = 0;
        state.interaction.initialMouseOffsetX = 0;
        state.interaction.initialMouseOffsetY = 0;
        state.interaction.elementCenterX = 0;
        state.interaction.elementCenterY = 0;
        state.interaction.elementRotation = 0;
        state.interaction.initialLocalMouseOffsetXFromCorner = 0;
        state.interaction.initialLocalMouseOffsetYFromCorner = 0;
        
        document.removeEventListener('mousemove', handleElementMouseMove);
        document.removeEventListener('mouseup', handleElementMouseUp);
        
        updateViewport();
        // Re-add handles after any interaction that changes the element
        updateSelectionOnly(true);
        queueProjectSave();
    } else if (isDraggingStarted || isResizeStarted || isRotateStarted) {
        // Just a click, no actual drag/resize/rotate happened
        // Clear the started flags and event listeners
        state.interaction.isDraggingStarted = false;
        state.interaction.isResizeStarted = false;
        state.interaction.isRotateStarted = false;
        state.interaction.deltaMode = false;
        state.interaction.isCtrlHeld = false;
        state.interaction.elementInitialAnchorX = 0;
        state.interaction.elementInitialAnchorY = 0;
        state.interaction.elementInitialVisualX = 0;
        state.interaction.elementInitialVisualY = 0;
        state.interaction.initialMouseOffsetX = 0;
        state.interaction.initialMouseOffsetY = 0;
        state.interaction.elementCenterX = 0;
        state.interaction.elementCenterY = 0;
        state.interaction.elementRotation = 0;
        state.interaction.initialLocalMouseOffsetXFromCorner = 0;
        state.interaction.initialLocalMouseOffsetYFromCorner = 0;
        
        document.removeEventListener('mousemove', handleElementMouseMove);
        document.removeEventListener('mouseup', handleElementMouseUp);
        
        // Re-add handles (for clicks that don't turn into drags) without recreating elements
        updateSelectionOnly(true);
    }
}

