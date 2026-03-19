// Hand Landmark IDs
// 0: Wrist, 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 16: Ring Tip, 20: Pinky Tip

const getDistance = (a, b) => {
    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2) +
        Math.pow(a.z - b.z, 2)
    );
};

const isFingerExtended = (landmarks, tipIdx) => {
    const wrist = landmarks[0];
    const tip = landmarks[tipIdx];
    const pip = landmarks[tipIdx - 2];
    return getDistance(wrist, tip) > getDistance(wrist, pip) * 1.1;
};

const isThumbExtended = (landmarks) => {
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    const indexMCP = landmarks[5];

    // Thumb is extended if tip is far from index MCP
    return getDistance(thumbTip, indexMCP) > getDistance(thumbMCP, indexMCP);
};

export const detectGesture = (landmarks) => {
    if (!landmarks || landmarks.length < 21) return 'NONE';

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    // Distances
    const pinchDistance = getDistance(thumbTip, indexTip);
    const thumbMiddleDistance = getDistance(thumbTip, middleTip);

    // Check finger states
    const indexUp = isFingerExtended(landmarks, 8);
    const middleUp = isFingerExtended(landmarks, 12);
    const ringUp = isFingerExtended(landmarks, 16);
    const pinkyUp = isFingerExtended(landmarks, 20);
    const thumbOut = isThumbExtended(landmarks);

    // === GESTURES ===

    // PINCH: Thumb and Index touching
    if (pinchDistance < 0.06) {
        return 'PINCH';
    }

    // THUMB_INDEX_MIDDLE: Three finger pinch (for color change)
    if (pinchDistance < 0.08 && thumbMiddleDistance < 0.08) {
        return 'THREE_FINGER';
    }

    // FIST: All fingers curled
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
        return 'FIST';
    }

    // OPEN_PALM: All fingers extended
    if (indexUp && middleUp && ringUp && pinkyUp) {
        return 'OPEN_PALM';
    }

    // PEACE / VICTORY: Index and Middle up
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
        return 'PEACE';
    }

    // POINT: Only index up
    if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        return 'POINT';
    }

    // HORNS: Index and Pinky up (Rock on!)
    if (indexUp && !middleUp && !ringUp && pinkyUp) {
        return 'GRAVITY';
    }

    // THUMBS_UP: Only thumb extended, fist otherwise
    if (thumbOut && !indexUp && !middleUp && !ringUp && !pinkyUp) {
        return 'THUMBS_UP';
    }

    // SHAKA: Thumb and Pinky out
    if (thumbOut && !indexUp && !middleUp && !ringUp && pinkyUp) {
        return 'SHAKA';
    }

    // THREE: Index, Middle, Ring up
    if (indexUp && middleUp && ringUp && !pinkyUp) {
        return 'THREE';
    }

    // FOUR: All except thumb
    if (indexUp && middleUp && ringUp && pinkyUp && !thumbOut) {
        return 'FOUR';
    }

    return 'IDLE';
};

// Get hand center position
export const getHandCenter = (landmarks) => {
    if (!landmarks || landmarks.length < 21) return null;

    const palm = landmarks[9]; // Middle finger MCP as palm center
    return {
        x: palm.x,
        y: palm.y,
        z: palm.z
    };
};

// Get pinch position (midpoint between thumb and index)
export const getPinchPosition = (landmarks) => {
    if (!landmarks || landmarks.length < 21) return null;

    const thumb = landmarks[4];
    const index = landmarks[8];

    return {
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2,
        z: (thumb.z + index.z) / 2
    };
};

// Get hand rotation (simplified)
export const getHandRotation = (landmarks) => {
    if (!landmarks || landmarks.length < 21) return 0;

    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    return Math.atan2(middleMCP.y - wrist.y, middleMCP.x - wrist.x);
};
