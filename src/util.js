/**
 * Translate mouse page coords to canvas coords
 * @param {MouseEvent} event mouse event with coords
 * @param {HTMLCanvasElement} canvas canvas to map to
 * @returns
 */
function translateMouse(event, canvas) {
    const bounds = canvas.getBoundingClientRect();
    return {
        x: event.offsetX * (canvas.width / bounds.width),
        y: event.offsetY * (canvas.height / bounds.height),
    };
}

/**
 * Copies text to clipboard
 * @param {string} str text to copy
 */
function copy(str) {
    navigator.clipboard.writeText(str);
}

/**
 * Generate a random int between min and max.
 * Min inclusive, max exclusive.
 * @param {number} min
 * @param {number} max
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Returns null on errors
 * @param {string} str base64 json string
 * @returns {*|null}
 */
function parseEncodedJson(str) {
    try {
        const data = JSON.parse(atob(str));
        return data;
    } catch (e) {
        return null;
    }
}

/**
 * Clamps a value between min and max
 * @param {number} min smallest possible result
 * @param {number} max largest possible result
 * @param {number} val value to clamp
 * @returns {number} clamped value
 */
function clamp(min, max, val) {
    if (Number.isNaN(val)) return min;
    return Math.max(min, Math.min(max, val));
}

/**
 * Generate a random uuid
 * @returns {string} uuid
 */
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        // eslint-disable-next-line no-bitwise
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

export { translateMouse, copy, random, parseEncodedJson, clamp, uuidv4 };
