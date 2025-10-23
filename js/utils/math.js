/* ============================================
   MATH UTILITIES - Easing, Interpolation, Clamping
   ============================================ */

/**
 * Easing functions for animations
 */
export const easingFunctions = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Interpolate between two positions
 * @param {object} pos1 - {x, y}
 * @param {object} pos2 - {x, y}
 * @param {number} t - Progress (0-1)
 * @returns {object} Interpolated position {x, y}
 */
export function lerpPosition(pos1, pos2, t) {
    return {
        x: lerp(pos1.x, pos2.x, t),
        y: lerp(pos1.y, pos2.y, t)
    };
}

/**
 * Interpolate between two sizes
 * @param {object} size1 - {width, height}
 * @param {object} size2 - {width, height}
 * @param {number} t - Progress (0-1)
 * @returns {object} Interpolated size {width, height}
 */
export function lerpSize(size1, size2, t) {
    return {
        width: lerp(size1.width, size2.width, t),
        height: lerp(size1.height, size2.height, t)
    };
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color (e.g., '#FF6B6B')
 * @returns {object} RGB object {r, g, b}
 */
export function hexToRgb(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return { r, g, b };
}

/**
 * Calculate angle between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Angle in radians
 */
export function angleBetweenPoints(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} Degrees
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Rotate a point around an origin.
 * @param {number} x - X coordinate of the point to rotate.
 * @param {number} y - Y coordinate of the point to rotate.
 * @param {number} originX - X coordinate of the rotation origin.
 * @param {number} originY - Y coordinate of the rotation origin.
 * @param {number} angleDeg - Rotation angle in degrees.
 * @returns {object} - New coordinates {x, y} of the rotated point.
 */
export function rotatePoint(x, y, originX, originY, angleDeg) {
    const angleRad = degreesToRadians(angleDeg);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = x - originX;
    const dy = y - originY;
    const rotatedX = dx * cos - dy * sin + originX;
    const rotatedY = dx * sin + dy * cos + originY;
    return { x: rotatedX, y: rotatedY };
}

