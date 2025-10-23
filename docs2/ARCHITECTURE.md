# Architecture Overview

> Technical documentation for developers

---

## Overview

Auto Explainer v2 is a **browser-based**, **local-first** animation tool built with:
- **Vanilla JavaScript** (ES6 modules)
- **File System Access API** (for direct folder access)
- **HTML5 Canvas** (for viewport rendering)
- **CSS3** (for UI styling)

**No frameworks, no build system, no server required.**

---

## File Structure

```
auto_explainer/
├── index_v2.html              ← Main entry point
│
├── css/                       ← Stylesheets
│   ├── base.css              ← Variables, reset, layout
│   ├── utilities.css         ← Helper classes, scrollbars
│   └── components/
│       ├── topbar.css
│       ├── sidebar.css
│       ├── viewport.css
│       ├── timeline.css
│       ├── modals.css
│       ├── panels.css
│       └── history.css
│
└── js/                        ← JavaScript modules
    ├── main-v2.js            ← Entry point & initialization
    │
    ├── state/                ← State management
    │   ├── state.js         ← Central state object
    │   └── constants.js     ← Configuration constants
    │
    ├── api/                  ← External APIs
    │   └── filesystem.js    ← File System Access API wrapper
    │
    ├── core/                 ← Core functionality
    │   ├── project-v2.js    ← Project loading/saving
    │   ├── assets-v2.js     ← Asset management
    │   ├── playback.js      ← Animation playback
    │   └── history.js       ← Undo/redo system
    │
    ├── viewport/             ← Viewport rendering
    │   ├── viewport.js      ← Main viewport logic
    │   ├── viewport-elements.js   ← Element creation
    │   └── viewport-interaction.js ← Mouse interactions
    │
    ├── timeline/             ← Timeline UI
    │   ├── timeline.js      ← Timeline rendering
    │   ├── timeline-interaction.js ← Mouse interactions
    │   └── playhead.js      ← Playhead control
    │
    ├── keyframes/            ← Keyframe system
    │   ├── keyframe-system.js  ← Interpolation engine
    │   └── keyframe-ui.js      ← Keyframe UI rendering
    │
    ├── animation/            ← Animation engine
    │   ├── animation-engine.js ← Animation calculations
    │   └── animation-panel.js  ← Animation UI panel
    │
    ├── text/                 ← Text objects
    │   ├── text-editor.js   ← Text editor UI
    │   ├── text-renderer.js ← Text rendering
    │   └── text-utils.js    ← Text utilities
    │
    ├── ui/                   ← UI components
    │   ├── history-panel.js ← History UI
    │   └── keyboard.js      ← Keyboard shortcuts
    │
    └── utils/                ← Utilities
        ├── dom.js           ← DOM helpers
        ├── math.js          ← Math utilities
        └── debug-logger.js  ← Debug panel
```

---

## Module Dependencies

### Layer 1: Foundation (No Dependencies)
```
state/
├── constants.js      ← Pure data
└── state.js          ← Imports: constants.js

utils/
├── math.js           ← Pure functions
├── dom.js            ← Pure DOM utilities
└── debug-logger.js   ← Logging utilities

api/
└── filesystem.js     ← Browser API wrapper
```

### Layer 2: Core Systems (Use Foundation)
```
core/
├── history.js        ← Imports: state
├── playback.js       ← Imports: state, dom, viewport, timeline
├── assets-v2.js      ← Imports: state, dom, filesystem, viewport
└── project-v2.js     ← Imports: state, filesystem, assets, viewport, timeline
```

### Layer 3: Feature Modules (Use Core & Foundation)
```
viewport/            ← Rendering engine
├── viewport.js
├── viewport-elements.js
└── viewport-interaction.js

timeline/            ← Timeline UI
├── timeline.js
├── timeline-interaction.js
└── playhead.js

keyframes/           ← Keyframe system
├── keyframe-system.js
└── keyframe-ui.js

animation/           ← Animation engine
├── animation-engine.js
└── animation-panel.js

text/                ← Text features
├── text-editor.js
├── text-renderer.js
└── text-utils.js
```

### Layer 4: Entry Point (Orchestrator)
```
main-v2.js           ← Initializes everything
├── Imports all core systems
├── Sets up keyboard shortcuts
├── Initializes UI
└── Auto-restores last project
```

---

## State Management

### Central State Object

```javascript
// js/state/state.js
export const state = {
    project: null,              // Full JSON data
    loadedAssets: {},           // { assetId: HTMLElement }
    currentTime: 0,             // Current playhead time
    isPlaying: false,           // Playback state
    selection: {
        element: null,          // Selected timeline index
        block: null            // Selected timeline block
    },
    timeline: {
        zoom: 50,              // Pixels per second
        panX: 0,               // Horizontal scroll offset
        panY: 0                // Vertical scroll offset
    },
    projectHandle: null,        // File System Access handle
    assetsHandle: null         // assets/ folder handle
};
```

### State Access

All modules import and modify the single `state` object:

```javascript
import { state } from '../state/state.js';

// Read
console.log(state.currentTime);

// Write
state.currentTime = 5.0;
```

**Benefits:**
- Single source of truth
- Easy debugging
- No prop drilling
- Simple state updates

---

## Key Systems

### 1. File System Access

```javascript
// js/api/filesystem.js

// Open folder
const dirHandle = await window.showDirectoryPicker();

// Read file
const fileHandle = await dirHandle.getFileHandle('project.json');
const file = await fileHandle.getFile();
const text = await file.text();

// Write file
const writable = await fileHandle.createWritable();
await writable.write(JSON.stringify(data));
await writable.close();
```

**Features:**
- Direct folder access (no server)
- Read/write files
- Watch for changes
- Persistent permissions

---

### 2. Rendering Pipeline

```
Timeline update →
  Calculate current time →
    For each timeline item:
      Check if active (startTime ≤ time ≤ endTime) →
        Apply keyframes →
          Apply animations →
            Create element →
              Render to viewport
```

**Key functions:**

```javascript
// js/viewport/viewport.js
export function updateViewport() {
    // 1. Clear canvas
    // 2. Render background video
    // 3. For each timeline item:
    //    - Calculate interpolated values
    //    - Apply animations
    //    - Create DOM element
    //    - Position and style
}
```

---

### 3. Keyframe Interpolation

```javascript
// js/keyframes/keyframe-system.js
export function interpolateKeyframes(keyframes, currentTime, property) {
    // 1. Find surrounding keyframes
    const before = findKeyframeBefore(keyframes, currentTime);
    const after = findKeyframeAfter(keyframes, currentTime);
    
    // 2. Calculate progress
    const progress = (currentTime - before.time) / (after.time - before.time);
    
    // 3. Apply easing
    const easedProgress = applyEasing(progress, after.easing);
    
    // 4. Interpolate value
    return lerp(before.value, after.value, easedProgress);
}
```

**Supported properties:**
- Position (x, y)
- Size (width, height)
- Rotation (degrees)
- Opacity (0-1)

---

### 4. Animation Engine

```javascript
// js/animation/animation-engine.js
export function getAnimationState(item, currentTime) {
    const relativeTime = currentTime - item.startTime;
    const itemDuration = item.endTime - item.startTime;
    
    // Check entry animation
    if (relativeTime < item.animation.in.duration) {
        return applyInAnimation(item, relativeTime);
    }
    
    // Check exit animation
    if (relativeTime > itemDuration - item.animation.out.duration) {
        return applyOutAnimation(item, itemDuration - relativeTime);
    }
    
    // Normal state
    return { opacity: 1, translateX: 0, translateY: 0, scaleValue: 1 };
}
```

**Animation types:**
- fadeIn/Out - Opacity interpolation
- slideIn/Out - Translate interpolation  
- scaleIn/Out - Scale interpolation

---

### 5. Undo/Redo System

```javascript
// js/core/history.js

const history = {
    snapshots: [],          // Array of state snapshots
    currentIndex: -1,       // Current position in history
    maxSnapshots: 50       // Max history depth
};

export function recordChange(description) {
    // 1. Deep clone current state
    const snapshot = JSON.parse(JSON.stringify(state.project));
    
    // 2. Truncate future if not at end
    if (currentIndex < snapshots.length - 1) {
        snapshots.splice(currentIndex + 1);
    }
    
    // 3. Add new snapshot
    snapshots.push({ data: snapshot, description, timestamp: Date.now() });
    
    // 4. Limit size
    if (snapshots.length > maxSnapshots) {
        snapshots.shift();
    }
    
    // 5. Move forward
    currentIndex = snapshots.length - 1;
}
```

---

## Performance Considerations

### Optimizations Applied

1. **Lazy Element Creation**
   - Elements created only when visible
   - Not pre-rendered

2. **Debounced Auto-save**
   - Waits 500ms after last change
   - Prevents excessive disk writes

3. **RAF-based Animation**
   - Uses `requestAnimationFrame`
   - Synced with display refresh

4. **Muted Videos**
   - No audio processing overhead
   - Faster playback

5. **Element Pooling**
   - Reuses DOM elements
   - Reduces GC pressure

### Known Bottlenecks

1. **Many Simultaneous Elements**
   - Solution: Limit to <20 active elements

2. **Large Images/Videos**
   - Solution: Compress media, use smaller sizes

3. **Many Keyframes**
   - Solution: Limit keyframes per property

4. **High Resolution Viewport**
   - Solution: Use 720p for editing, 1080p for export

---

## Browser Compatibility

### Required APIs

- **File System Access API** ✅ Chrome, Edge, Opera
- **ES6 Modules** ✅ All modern browsers
- **CSS Grid** ✅ All modern browsers
- **HTMLVideoElement** ✅ All modern browsers

### Unsupported Browsers

- ❌ Firefox - No File System Access API
- ❌ Safari - No File System Access API  
- ❌ IE11 - No ES6 modules

---

## Extension Points

### Adding New Asset Types

1. Update `constants.js` asset types
2. Add loading logic in `assets-v2.js`
3. Add rendering in `viewport-elements.js`
4. Add UI in `sidebar.css`

### Adding New Animation Types

1. Add type to `ANIMATION_TYPES` in `constants.js`
2. Implement in `animation-engine.js`
3. Add to UI in `animation-panel.js`

### Adding New Keyframe Properties

1. Add to `KEYFRAME_PROPERTIES` in `constants.js`
2. Implement interpolation in `keyframe-system.js`
3. Add UI controls in `keyframe-ui.js`

---

## Testing

Currently no automated tests. Manual testing workflow:

1. **Smoke test:** Open project, add asset, create block
2. **Transform test:** Drag, resize, rotate element
3. **Animation test:** Add animations, preview playback
4. **Keyframe test:** Add keyframes, scrub timeline
5. **Save/Load test:** Save project, reload, verify
6. **Undo/Redo test:** Make changes, undo, redo, verify

---

## Debugging

### Debug Panel

```javascript
// Enable in console:
window.toggleDebugPanel();
```

Shows:
- State changes
- File operations
- Rendering updates
- Error messages

### Console Logging

```javascript
import { debugLog } from './utils/debug-logger.js';

debugLog('Operation completed', { data: someData });
```

---

## Development Workflow

### Setup

```bash
# No build required!
# Just open index_v2.html in browser

# For live reload (optional):
npm install -g live-server
live-server
```

### Hot Reload

Use Live Server or similar:
- Changes to JS/CSS reload automatically
- Keep projects outside app directory!

### Debugging

- Use Chrome DevTools (F12)
- Enable debug panel
- Check console for errors
- Use breakpoints in Sources tab

---

## Code Style

### Conventions

- **ES6 modules** - All files are modules
- **Named exports** - Explicit function exports
- **camelCase** - Functions and variables
- **PascalCase** - Constants only
- **Comments** - JSDoc-style for functions
- **Semicolons** - Always use

### Example Module

```javascript
/* ============================================
   MODULE_NAME - Brief description
   ============================================ */

import { state } from '../state/state.js';
import { createElement } from '../utils/dom.js';

/**
 * Brief description
 * @param {Type} param - Description
 * @returns {Type} Description
 */
export function myFunction(param) {
    // Implementation
}

// Private helper (not exported)
function helperFunction() {
    // Implementation
}
```

---

## Future Architecture Changes

### Planned Improvements

1. **State Management**
   - Move to immutable state
   - Add state change events
   - Better undo/redo

2. **Rendering**
   - WebGL for better performance
   - Offscreen canvas
   - Worker-based rendering

3. **Testing**
   - Unit tests for core functions
   - Integration tests
   - E2E tests

4. **TypeScript**
   - Type safety
   - Better IDE support
   - Compile-time checks

---

**Questions?** Check the [Features Guide](FEATURES.md) or [Troubleshooting](TROUBLESHOOTING.md)!

