# JSON Guide - Complete Reference

> Complete documentation for the Auto Explainer JSON format

---

## Overview

Every project consists of a single JSON file that defines:
- **Project settings** (duration, viewport, fps)
- **Assets** (images, videos, masks)
- **Timeline** (images/videos and text objects with animations)

---

## File Structure

```json
{
  "project": { },
  "assets": [ ],
  "timeline": [ ]
}
```

---

## 1. Project Object

Defines global project settings.

### Schema
```json
{
  "project": {
    "name": "string",              // Project identifier
    "duration": 10,                // Total duration in seconds
    "fps": 30,                     // Frames per second
    "viewport": {
      "width": 1920,               // Canvas width in pixels
      "height": 1080,              // Canvas height in pixels
      "aspectRatio": "16:9"        // Display ratio
    },
    "backgroundColor": "#ffffff"   // Hex color for background
  }
}
```

### Common Viewport Sizes
```json
// 1080p (Full HD)
"viewport": { "width": 1920, "height": 1080, "aspectRatio": "16:9" }

// 720p (HD)
"viewport": { "width": 1280, "height": 720, "aspectRatio": "16:9" }

// Square (Instagram)
"viewport": { "width": 1080, "height": 1080, "aspectRatio": "1:1" }

// Vertical (TikTok/Stories)
"viewport": { "width": 1080, "height": 1920, "aspectRatio": "9:16" }
```

---

## 2. Assets Array

Defines all media assets used in the project.

### Asset Types

#### Regular Image
```json
{
  "id": "logo",
  "filename": "logo.png",
  "type": "image",
  "defaultSize": {
    "width": 400,
    "height": 400
  }
}
```

#### Image Mask (Colored)
White areas become your chosen color, black becomes transparent.

```json
{
  "id": "star",
  "filename": "star_mask.png",
  "type": "image",
  "maskMode": true,               // Enable mask mode
  "color": "#FFD700",             // Color to apply
  "defaultSize": {
    "width": 300,
    "height": 300
  }
}
```

#### Regular Video
```json
{
  "id": "intro_clip",
  "filename": "intro.mp4",
  "type": "video",
  "loop": false,                  // Optional: loop video
  "defaultSize": {
    "width": 800,
    "height": 450
  }
}
```

#### Video Background
```json
{
  "id": "bg_video",
  "filename": "background.mp4",
  "type": "video",
  "isBackground": true,           // Use as background
  "loop": true,                   // Background should loop
  "defaultSize": {
    "width": 1920,
    "height": 1080
  }
}
```

### Asset Properties Reference

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `filename` | string | Yes | File in assets/ folder |
| `type` | string | Yes | `"image"` or `"video"` |
| `maskMode` | boolean | No | Enable color mask (images only) |
| `color` | string | Yes if maskMode | Hex color for mask |
| `isBackground` | boolean | No | Use as background (videos only) |
| `loop` | boolean | No | Loop video playback |
| `defaultSize` | object | Yes | Default width/height |

---

## 3. Timeline Array

Defines when and how assets appear.

### Timeline Item Types

1. **Asset-based items** (images/videos) - have `assetId`
2. **Text objects** - have `type: "text"`

---

### Asset-Based Timeline Items

#### Basic Structure
```json
{
  "assetId": "logo",
  "layer": 2,
  "startTime": 0,
  "endTime": 5,
  "position": {
    "x": 640,
    "y": 360,
    "anchorX": 0.5,
    "anchorY": 0.5
  },
  "size": {
    "width": 400,
    "height": 400
  },
  "rotation": 0,
  "opacity": 1
}
```

#### With Animations
```json
{
  "assetId": "logo",
  "layer": 2,
  "startTime": 0,
  "endTime": 5,
  "position": { "x": 640, "y": 360, "anchorX": 0.5, "anchorY": 0.5 },
  "size": { "width": 400, "height": 400 },
  "rotation": 0,
  "opacity": 1,
  
  "animation": {
    "in": {
      "type": "fadeIn",            // fadeIn, slideIn, scaleIn, none
      "duration": 0.5,             // seconds
      "easing": "easeOut",         // linear, easeIn, easeOut, easeInOut
      "direction": "down"          // only for slideIn: left, right, up, down
    },
    "out": {
      "type": "fadeOut",           // fadeOut, slideOut, scaleOut, none
      "duration": 0.5,
      "easing": "easeIn"
    }
  }
}
```

#### With Keyframes
```json
{
  "assetId": "logo",
  "layer": 2,
  "startTime": 0,
  "endTime": 10,
  "position": { "x": 640, "y": 360, "anchorX": 0.5, "anchorY": 0.5 },
  "size": { "width": 400, "height": 400 },
  "rotation": 0,
  "opacity": 1,
  
  "keyframes": {
    "position": [
      { "time": 0, "value": { "x": 100, "y": 360 }, "easing": "linear" },
      { "time": 5, "value": { "x": 640, "y": 360 }, "easing": "easeInOut" },
      { "time": 10, "value": { "x": 1180, "y": 360 }, "easing": "easeOut" }
    ],
    "size": [
      { "time": 0, "value": { "width": 200, "height": 200 }, "easing": "linear" },
      { "time": 5, "value": { "width": 400, "height": 400 }, "easing": "easeOut" }
    ],
    "rotation": [
      { "time": 0, "value": 0, "easing": "linear" },
      { "time": 10, "value": 360, "easing": "linear" }
    ],
    "opacity": [
      { "time": 0, "value": 0, "easing": "linear" },
      { "time": 2, "value": 1, "easing": "easeIn" },
      { "time": 8, "value": 1, "easing": "linear" },
      { "time": 10, "value": 0, "easing": "easeOut" }
    ]
  }
}
```

---

### Text Timeline Items

#### Basic Text
```json
{
  "type": "text",
  "assetId": "title_text",
  "text": "Hello World!",
  "layer": 10,
  "startTime": 0,
  "endTime": 5,
  "position": {
    "x": 960,
    "y": 540,
    "anchorX": 0.5,
    "anchorY": 0.5
  },
  "size": {
    "width": 800,
    "height": 200
  },
  "rotation": 0,
  "opacity": 1,
  
  "style": {
    "fontFamily": "Arial, sans-serif",
    "fontSize": 64,
    "fontWeight": "bold",
    "fontStyle": "normal",
    "color": "#ffffff",
    "backgroundColor": "rgba(0, 0, 0, 0.8)",
    "textAlign": "center",
    "lineHeight": 1.2,
    "letterSpacing": 2,
    "textDecoration": "none",
    "textShadow": "2px 2px 4px rgba(0,0,0,0.5)",
    "padding": 20,
    "borderRadius": 10
  }
}
```

#### Text with Animation & Keyframes
Text objects support the same `animation` and `keyframes` as asset-based items!

```json
{
  "type": "text",
  "assetId": "animated_title",
  "text": "Welcome!",
  "layer": 10,
  "startTime": 0,
  "endTime": 5,
  "position": { "x": 960, "y": 540, "anchorX": 0.5, "anchorY": 0.5 },
  "size": { "width": 600, "height": 150 },
  "rotation": 0,
  "opacity": 1,
  
  "style": {
    "fontFamily": "Impact, sans-serif",
    "fontSize": 72,
    "color": "#FFD700"
  },
  
  "animation": {
    "in": {
      "type": "slideIn",
      "direction": "down",
      "duration": 0.8,
      "easing": "easeOut"
    }
  },
  
  "keyframes": {
    "rotation": [
      { "time": 0, "value": -5, "easing": "easeInOut" },
      { "time": 2.5, "value": 5, "easing": "easeInOut" },
      { "time": 5, "value": 0, "easing": "easeInOut" }
    ]
  }
}
```

---

## Property Reference Tables

### Position Object
| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `x` | number | any | X coordinate in pixels |
| `y` | number | any | Y coordinate in pixels |
| `anchorX` | number | 0.0-1.0 | Anchor point: 0=left, 0.5=center, 1=right |
| `anchorY` | number | 0.0-1.0 | Anchor point: 0=top, 0.5=center, 1=bottom |

### Animation Types
| In | Out | Description |
|----|-----|-------------|
| `fadeIn` | `fadeOut` | Opacity fade |
| `slideIn` | `slideOut` | Slide from direction |
| `scaleIn` | `scaleOut` | Scale from/to zero |
| `none` | `none` | No animation |

### Easing Functions
| Easing | Description |
|--------|-------------|
| `linear` | Constant speed |
| `easeIn` | Slow start, fast end |
| `easeOut` | Fast start, slow end |
| `easeInOut` | Slow start and end |

### Text Style Properties
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `fontFamily` | string | `"Arial, sans-serif"` | Font name |
| `fontSize` | number | `48` | Size in pixels |
| `fontWeight` | string | `"bold"`, `"normal"`, `"300"` | Weight |
| `fontStyle` | string | `"normal"`, `"italic"` | Style |
| `color` | string | `"#ffffff"` | Text color |
| `backgroundColor` | string | `"transparent"`, `"#000000"` | Background |
| `textAlign` | string | `"left"`, `"center"`, `"right"` | Alignment |
| `lineHeight` | number | `1.2` | Line height multiplier |
| `letterSpacing` | number | `2` | Letter spacing in pixels |
| `textDecoration` | string | `"none"`, `"underline"` | Decoration |
| `textShadow` | string | `"2px 2px 4px rgba(0,0,0,0.5)"` | CSS shadow |
| `padding` | number | `10` | Padding in pixels |
| `borderRadius` | number | `5` | Border radius in pixels |

---

## Complete Example Project

```json
{
  "project": {
    "name": "example_animation",
    "duration": 15,
    "fps": 30,
    "viewport": {
      "width": 1920,
      "height": 1080,
      "aspectRatio": "16:9"
    },
    "backgroundColor": "#1a1a2e"
  },
  
  "assets": [
    {
      "id": "background",
      "filename": "background.mp4",
      "type": "video",
      "isBackground": true,
      "loop": true,
      "defaultSize": { "width": 1920, "height": 1080 }
    },
    {
      "id": "logo",
      "filename": "logo.png",
      "type": "image",
      "defaultSize": { "width": 400, "height": 400 }
    },
    {
      "id": "star",
      "filename": "star_mask.png",
      "type": "image",
      "maskMode": true,
      "color": "#FFD700",
      "defaultSize": { "width": 200, "height": 200 }
    }
  ],
  
  "timeline": [
    {
      "assetId": "logo",
      "layer": 2,
      "startTime": 0,
      "endTime": 5,
      "position": { "x": 960, "y": 540, "anchorX": 0.5, "anchorY": 0.5 },
      "size": { "width": 400, "height": 400 },
      "rotation": 0,
      "opacity": 1,
      "animation": {
        "in": { "type": "scaleIn", "duration": 0.8, "easing": "easeOut" },
        "out": { "type": "fadeOut", "duration": 0.5, "easing": "easeIn" }
      }
    },
    {
      "assetId": "star",
      "layer": 3,
      "startTime": 2,
      "endTime": 10,
      "position": { "x": 1400, "y": 200, "anchorX": 0.5, "anchorY": 0.5 },
      "size": { "width": 150, "height": 150 },
      "rotation": 0,
      "opacity": 1,
      "keyframes": {
        "rotation": [
          { "time": 2, "value": 0, "easing": "linear" },
          { "time": 10, "value": 360, "easing": "linear" }
        ]
      }
    },
    {
      "type": "text",
      "assetId": "title",
      "text": "Example Animation",
      "layer": 10,
      "startTime": 1,
      "endTime": 6,
      "position": { "x": 960, "y": 800, "anchorX": 0.5, "anchorY": 0.5 },
      "size": { "width": 1200, "height": 150 },
      "rotation": 0,
      "opacity": 1,
      "style": {
        "fontFamily": "Impact, sans-serif",
        "fontSize": 72,
        "fontWeight": "bold",
        "color": "#ffffff",
        "backgroundColor": "rgba(0, 0, 0, 0.7)",
        "textAlign": "center",
        "padding": 20,
        "borderRadius": 10
      },
      "animation": {
        "in": { "type": "slideIn", "direction": "up", "duration": 0.6, "easing": "easeOut" }
      }
    }
  ]
}
```

---

## Tips & Best Practices

### Layering
- Higher `layer` values appear on top
- Background videos are automatically on layer -1
- Typical layering: background (-1), images (0-5), text (10+)

### Timing
- Use `startTime` and `endTime` to control visibility
- Keyframe times are absolute (not relative to startTime)
- Animation durations are in seconds

### Positioning
- Anchor points affect transformations
- `anchorX: 0.5, anchorY: 0.5` = rotate around center
- `anchorX: 0, anchorY: 0` = rotate around top-left

### Keyframes
- Must be within item's startTime/endTime range
- Times must be sorted (tool auto-sorts)
- Easing affects transition TO the keyframe

### Text
- Use `\n` for line breaks in text
- Transparent backgrounds: `"backgroundColor": "transparent"`
- Shadows: `"textShadow": "2px 2px 4px rgba(0,0,0,0.5)"`

---

## Default Values

If properties are omitted, these defaults apply:

```json
{
  "rotation": 0,
  "opacity": 1,
  "animation": {
    "in": { "type": "none", "duration": 0, "easing": "linear" },
    "out": { "type": "none", "duration": 0, "easing": "linear" }
  },
  "keyframes": {}
}
```

Text default style:
```json
{
  "fontFamily": "Arial, sans-serif",
  "fontSize": 48,
  "fontWeight": "normal",
  "fontStyle": "normal",
  "color": "#000000",
  "backgroundColor": "transparent",
  "textAlign": "center",
  "lineHeight": 1.2,
  "letterSpacing": 0,
  "textDecoration": "none",
  "textShadow": "none",
  "padding": 10,
  "borderRadius": 0
}
```

---

**Need help?** Check the [Features Guide](FEATURES.md) or [Troubleshooting](TROUBLESHOOTING.md)!

