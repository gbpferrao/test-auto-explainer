/* ============================================
   KEYFRAME SYSTEM - Interpolation & Application
   ============================================ */

import { easingFunctions, lerpPosition, lerpSize } from '../utils/math.js';

/**
 * Interpolate between keyframes at given time
 * @param {Array} keyframes - Sorted keyframe array
 * @param {number} currentTime - Current playback time
 * @param {string} property - Property name
 * @returns {*} Interpolated value
 */
export function interpolateKeyframes(keyframes, currentTime, property) {
    if (!keyframes || keyframes.length === 0) return null;
    
    // Sort keyframes by time
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    
    // Before first keyframe
    if (currentTime <= sorted[0].time) {
        return sorted[0].value;
    }
    
    // After last keyframe
    if (currentTime >= sorted[sorted.length - 1].time) {
        return sorted[sorted.length - 1].value;
    }
    
    // Find surrounding keyframes
    let prevKf = sorted[0];
    let nextKf = sorted[1];
    
    for (let i = 0; i < sorted.length - 1; i++) {
        if (currentTime >= sorted[i].time && currentTime <= sorted[i + 1].time) {
            prevKf = sorted[i];
            nextKf = sorted[i + 1];
            break;
        }
    }
    
    // Calculate interpolation factor
    const duration = nextKf.time - prevKf.time;
    const elapsed = currentTime - prevKf.time;
    const rawT = elapsed / duration;
    
    // Apply easing
    const easing = prevKf.easing || 'linear';
    const t = easingFunctions[easing](rawT);
    
    // Interpolate based on value type
    if (typeof prevKf.value === 'number') {
        // Simple number interpolation (rotation, opacity)
        return prevKf.value + (nextKf.value - prevKf.value) * t;
    } else if (prevKf.value.x !== undefined) {
        // Position interpolation
        return lerpPosition(prevKf.value, nextKf.value, t);
    } else if (prevKf.value.width !== undefined) {
        // Size interpolation
        return lerpSize(prevKf.value, nextKf.value, t);
    }
    
    return prevKf.value;
}

/**
 * Apply keyframes to timeline item
 * @param {object} item - Timeline item
 * @param {number} currentTime - Current time
 * @returns {object} Item with keyframes applied
 */
export function applyKeyframes(item, currentTime) {
    if (!item.keyframes) return item;
    
    const result = { ...item };
    
    // Apply position keyframes
    if (item.keyframes.position) {
        const pos = interpolateKeyframes(item.keyframes.position, currentTime, 'position');
        if (pos) {
            result.position = { ...result.position, x: pos.x, y: pos.y };
        }
    }
    
    // Apply size keyframes
    if (item.keyframes.size) {
        const size = interpolateKeyframes(item.keyframes.size, currentTime, 'size');
        if (size) {
            result.size = { width: size.width, height: size.height };
        }
    }
    
    // Apply rotation keyframes
    if (item.keyframes.rotation) {
        const rot = interpolateKeyframes(item.keyframes.rotation, currentTime, 'rotation');
        if (rot !== null) {
            result.rotation = rot;
        }
    }
    
    // Apply opacity keyframes
    if (item.keyframes.opacity) {
        const op = interpolateKeyframes(item.keyframes.opacity, currentTime, 'opacity');
        if (op !== null) {
            result.opacity = op;
        }
    }
    
    return result;
}

