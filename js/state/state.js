/* ============================================
   STATE MANAGEMENT - Centralized Application State
   ============================================ */

import { DEFAULT_TIMELINE } from './constants.js';

// Application state - single source of truth
export const state = {
    // Project data
    project: null,
    
    // Playback state
    currentTime: 0,
    isPlaying: false,
    lastFrameTime: 0,
    fps: 30, // Frames per second (24, 25, 30, 60)
    
    // Timeline view state
    timeline: {
        zoom: DEFAULT_TIMELINE.zoom,
        panX: DEFAULT_TIMELINE.panX,
        panY: DEFAULT_TIMELINE.panY
    },
    
    // Selection state
    selection: {
        element: null,      // Primary selected viewport element index
        elements: [],       // Multiple selected elements (array of indices)
        block: null,        // Selected timeline block index
        keyframe: null      // { blockIndex, property, keyframeIndex }
    },
    
    // Loaded assets
    loadedAssets: {},
    
    // Interaction state
    interaction: {
        // Element interactions
        isDraggingElement: false,
        isResizingElement: false,
        isRotatingElement: false,
        isDraggingStarted: false,
        isResizeStarted: false,
        isRotateStarted: false,
        resizeCorner: null,
        elementDragStartX: 0,
        elementDragStartY: 0,
        elementInitialX: 0,
        elementInitialY: 0,
        elementInitialWidth: 0,
        elementInitialHeight: 0,
        elementInitialRotation: 0,
        rotationCenterX: 0,
        rotationCenterY: 0,
        isCtrlHeld: false,  // Track if Ctrl is held for delta mode
        deltaMode: false,   // Track if we're in delta all keyframes mode
        lastDeltaX: 0,      // Track last delta for incremental updates
        lastDeltaY: 0,
        lastDeltaWidth: 0,
        lastDeltaHeight: 0,
        lastDeltaRotation: 0,
        
        // Timeline interactions
        isPanning: false,
        isDraggingBlock: false,
        isResizingBlock: false,
        isDraggingPlayhead: false,
        isDraggingTimelineBackground: false,
        resizeHandle: null,
        dragStartX: 0,
        dragStartY: 0,
        dragStartPanX: 0,
        dragStartPanY: 0,
        draggedBlockIndex: -1,
        draggedBlockInitialStart: 0,
        draggedBlockInitialEnd: 0,
        
        // Keyframe interactions
        isDraggingKeyframe: false,
        keyframeDragIntent: false,
        justFinishedKeyframeDrag: false,
        draggedKeyframeBlockIndex: -1,
        draggedKeyframeProperty: null,
        draggedKeyframeIndex: -1,
        draggedKeyframeInitialTime: 0
    },
    
    // Server/project path
    projectBasePath: '',
    
    // Export state
    exportCancelled: false,
    
    // Animation preview
    animationPreviewInterval: null,
    
    // Auto-save
    saveTimeout: null
};

/**
 * Get a value from state
 * @param {string} path - Dot-separated path (e.g., 'timeline.zoom')
 * @returns {*} The value at the path
 */
export function getState(path) {
    const keys = path.split('.');
    let value = state;
    
    for (const key of keys) {
        if (value === undefined || value === null) return undefined;
        value = value[key];
    }
    
    return value;
}

/**
 * Update a value in state
 * @param {string} path - Dot-separated path
 * @param {*} value - New value
 */
export function setState(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = state;
    
    for (const key of keys) {
        if (!(key in target)) {
            target[key] = {};
        }
        target = target[key];
    }
    
    target[lastKey] = value;
}

/**
 * Reset state to initial values
 */
export function resetState() {
    state.project = null;
    state.currentTime = 0;
    state.isPlaying = false;
    state.lastFrameTime = 0;
    state.timeline = { ...DEFAULT_TIMELINE };
    state.selection = { element: null, block: null, keyframe: null };
    state.loadedAssets = {};
    state.projectBasePath = '';
}

/**
 * Deep clone project data to avoid mutations
 */
export function cloneProjectData(data) {
    return JSON.parse(JSON.stringify(data));
}

