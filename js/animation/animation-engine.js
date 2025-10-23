/* ============================================
   ANIMATION ENGINE - In/Out Animations
   ============================================ */

import { easingFunctions } from '../utils/math.js';

/**
 * Calculate animation state for timeline item
 * @param {object} item - Timeline item
 * @param {number} currentTime - Current time
 * @returns {object} Animation state
 */
export function getAnimationState(item, currentTime) {
    const inAnim = item.animation?.in || { type: "none", duration: 0, easing: "linear" };
    const outAnim = item.animation?.out || { type: "none", duration: 0, easing: "linear" };
    const loopAnim = item.animation?.loop || { type: "none" };
    
    const state = {
        isAnimatingIn: false,
        isAnimatingOut: false,
        hasLoopAnimation: loopAnim.type !== "none",
        inProgress: 0,
        outProgress: 0,
        loopProgress: 0,
        opacity: item.opacity,
        transform: { x: 0, y: 0, scale: 1 },
        rotation: 0
    };
    
    // Check if animating in
    if (inAnim.type !== "none" && currentTime >= item.startTime && currentTime < item.startTime + inAnim.duration) {
        state.isAnimatingIn = true;
        const rawProgress = (currentTime - item.startTime) / inAnim.duration;
        state.inProgress = easingFunctions[inAnim.easing || "linear"](rawProgress);
    }
    
    // Check if animating out
    if (outAnim.type !== "none" && currentTime >= item.endTime - outAnim.duration && currentTime <= item.endTime) {
        state.isAnimatingOut = true;
        const rawProgress = (currentTime - (item.endTime - outAnim.duration)) / outAnim.duration;
        state.outProgress = easingFunctions[outAnim.easing || "linear"](rawProgress);
    }
    
    // Calculate loop animation progress (relative time from start)
    if (state.hasLoopAnimation && currentTime >= item.startTime && currentTime <= item.endTime) {
        state.loopProgress = currentTime - item.startTime;
    }
    
    return state;
}

/**
 * Apply animation transforms to item
 * @param {object} item - Timeline item
 * @param {object} state - Animation state
 * @param {number} scale - Viewport scale
 * @returns {object} Transform values {opacity, translateX, translateY, scaleValue, rotationOffset}
 */
export function applyAnimationTransforms(item, state, scale) {
    const inAnim = item.animation?.in || { type: "none" };
    const outAnim = item.animation?.out || { type: "none" };
    const loopAnim = item.animation?.loop || { type: "none" };
    
    let opacity = item.opacity;
    let translateX = 0;
    let translateY = 0;
    let scaleValue = 1;
    let rotationOffset = 0;
    
    // If element is fading in, its initial opacity should be 0
    // This prevents a flash of full opacity before the fade-in starts
    const isFadingInEffectively = inAnim.type === "fadeIn" && state.isAnimatingIn;
    if (isFadingInEffectively) {
        opacity = 0;
    }

    // Apply IN animations
    if (state.isAnimatingIn) {
        switch (inAnim.type) {
            case "fadeIn":
                opacity = item.opacity * state.inProgress;
                break;
            case "slideIn":
                const inDistance = 100; // pixels
                if (inAnim.direction === "left") translateX = -inDistance * (1 - state.inProgress);
                else if (inAnim.direction === "right") translateX = inDistance * (1 - state.inProgress);
                else if (inAnim.direction === "up") translateY = -inDistance * (1 - state.inProgress);
                else if (inAnim.direction === "down") translateY = inDistance * (1 - state.inProgress);
                break;
            case "scaleIn":
                scaleValue = state.inProgress;
                break;
        }
    }
    
    // Apply OUT animations
    if (state.isAnimatingOut) {
        switch (outAnim.type) {
            case "fadeOut":
                opacity *= (1 - state.outProgress);
                break;
            case "slideOut":
                const outDistance = 100; // pixels
                if (outAnim.direction === "left") translateX = -outDistance * state.outProgress;
                else if (outAnim.direction === "right") translateX = outDistance * state.outProgress;
                else if (outAnim.direction === "up") translateY = -outDistance * state.outProgress;
                else if (outAnim.direction === "down") translateY = outDistance * state.outProgress;
                break;
            case "scaleOut":
                scaleValue = (1 - state.outProgress);
                break;
        }
    }
    
    // Apply LOOP animations
    if (state.hasLoopAnimation && !state.isAnimatingIn && !state.isAnimatingOut) {
        const loopTransforms = applyLoopAnimation(loopAnim, state.loopProgress);
        translateX += loopTransforms.translateX;
        translateY += loopTransforms.translateY;
        rotationOffset = loopTransforms.rotationOffset;
    }
    
    return { opacity, translateX, translateY, scaleValue, rotationOffset };
}

/**
 * Apply loop animation effects
 * @param {object} loopAnim - Loop animation config
 * @param {number} timeElapsed - Time since item start
 * @returns {object} Loop transform values
 */
function applyLoopAnimation(loopAnim, timeElapsed) {
    const result = {
        translateX: 0,
        translateY: 0,
        rotationOffset: 0
    };
    
    const cycleDuration = loopAnim.cycleDuration || 2.0;
    const minAngle = loopAnim.minAngle || -5;
    const maxAngle = loopAnim.maxAngle || 5;
    const maxOffset = loopAnim.maxOffset || 3;
    
    switch (loopAnim.type) {
        case "continuous_swing":
            // Smooth sine wave oscillation
            const progress = (timeElapsed % cycleDuration) / cycleDuration;
            const angle = minAngle + (maxAngle - minAngle) * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);
            result.rotationOffset = angle;
            break;
            
        case "blocky_swing":
            // Stepped rotation changes
            const stepDuration = cycleDuration / 4; // 4 steps per cycle
            const step = Math.floor(timeElapsed / stepDuration) % 4;
            // Oscillate between min and max in 4 steps: min -> mid -> max -> mid -> min
            if (step === 0) result.rotationOffset = minAngle;
            else if (step === 1) result.rotationOffset = (minAngle + maxAngle) / 2;
            else if (step === 2) result.rotationOffset = maxAngle;
            else result.rotationOffset = (minAngle + maxAngle) / 2;
            break;
            
        case "blocky_jitter":
            // Stepped rotation + position jitter
            const jitterStepDuration = cycleDuration / 8; // 8 steps per cycle
            const jitterStep = Math.floor(timeElapsed / jitterStepDuration) % 8;
            
            // Use step index to seed pseudo-random values (deterministic)
            const seed = jitterStep * 12345;
            const pseudoRandom1 = ((seed * 9301 + 49297) % 233280) / 233280;
            const pseudoRandom2 = ((seed * 9307 + 49211) % 233280) / 233280;
            const pseudoRandom3 = ((seed * 9319 + 49139) % 233280) / 233280;
            
            // Random rotation within range
            result.rotationOffset = minAngle + (maxAngle - minAngle) * pseudoRandom1;
            
            // Random position offset
            result.translateX = (pseudoRandom2 - 0.5) * 2 * maxOffset;
            result.translateY = (pseudoRandom3 - 0.5) * 2 * maxOffset;
            break;
    }
    
    return result;
}

