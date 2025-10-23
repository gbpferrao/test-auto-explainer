/* ============================================
   CONSTANTS - Configuration & Color Palette
   ============================================ */

// Color palette for timeline blocks
export const TIMELINE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#FFA07A', '#98D8C8', '#F7DC6F'
];

// Default viewport settings
export const DEFAULT_VIEWPORT = {
    width: 1280,
    height: 720,
    aspectRatio: '16:9'
};

// Default timeline settings
export const DEFAULT_TIMELINE = {
    zoom: 50,
    panX: 0,
    panY: 0,
    minZoom: 10,
    maxZoom: 200
};

// Default project settings
export const DEFAULT_PROJECT_DURATION = 10.0;
export const DEFAULT_FPS = 30;
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';

// Easing function names
export const EASING_TYPES = {
    LINEAR: 'linear',
    EASE_IN: 'easeIn',
    EASE_OUT: 'easeOut',
    EASE_IN_OUT: 'easeInOut'
};

// Animation types
export const ANIMATION_TYPES = {
    NONE: 'none',
    FADE_IN: 'fadeIn',
    FADE_OUT: 'fadeOut',
    SLIDE_IN: 'slideIn',
    SLIDE_OUT: 'slideOut',
    SCALE_IN: 'scaleIn',
    SCALE_OUT: 'scaleOut'
};

// Animation directions
export const ANIMATION_DIRECTIONS = {
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down'
};

// Keyframe properties
export const KEYFRAME_PROPERTIES = {
    POSITION: 'position',
    SIZE: 'size',
    ROTATION: 'rotation',
    OPACITY: 'opacity'
};

// Minimum element sizes
export const MIN_ELEMENT_SIZE = 20;

// Default text style
export const DEFAULT_TEXT_STYLE = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 48,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 0,
    textDecoration: 'none',
    textShadow: 'none',
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 0
};

// Sample project data
export const SAMPLE_PROJECT = {
    "project": {
        "name": "money_explainer",
        "duration": 10.0,
        "fps": 30,
        "viewport": {
            "width": 1280,
            "height": 720,
            "aspectRatio": "16:9"
        },
        "backgroundColor": "#ffffff"
    },
    "assets": [
        { 
            "id": "piggybank", 
            "filename": "piggybank.png", 
            "type": "image", 
            "maskMode": true,
            "color": "#4CAF50",
            "defaultSize": { "width": 200, "height": 200 } 
        },
        { 
            "id": "coin", 
            "filename": "coin.png", 
            "type": "image",
            "defaultSize": { "width": 100, "height": 100 } 
        },
        { 
            "id": "arrow", 
            "filename": "arrow.png", 
            "type": "image", 
            "maskMode": true,
            "color": "#FF6B6B",
            "defaultSize": { "width": 150, "height": 50 } 
        }
    ],
    "timeline": [
        {
            "assetId": "piggybank", "layer": 0, "startTime": 0.0, "endTime": 5.0,
            "position": { "x": 400, "y": 360, "anchorX": 0.5, "anchorY": 0.5 },
            "size": { "width": 300, "height": 300 }, "rotation": 0, "opacity": 1.0
        },
        {
            "assetId": "coin", "layer": 1, "startTime": 2.0, "endTime": 8.0,
            "position": { "x": 800, "y": 300, "anchorX": 0.5, "anchorY": 0.5 },
            "size": { "width": 150, "height": 150 }, "rotation": 0, "opacity": 1.0
        },
        {
            "assetId": "arrow", "layer": 2, "startTime": 3.5, "endTime": 7.5,
            "position": { "x": 640, "y": 500, "anchorX": 0.5, "anchorY": 0.5 },
            "size": { "width": 200, "height": 60 }, "rotation": 0, "opacity": 1.0
        }
    ]
};

