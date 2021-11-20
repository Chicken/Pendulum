import { Pendulum } from "./Pendulum.js";
import { PauseButton } from "./PauseButton.js";
import {
    copy,
    random,
    translateMouse,
    parseEncodedJson,
    clamp,
} from "./util.js";

const settings = document.getElementById("settings");
const selectedSettings = document.getElementById("selected");
const noneText = document.getElementById("noneText");

const gravitySlider = document.getElementById("gravity");
const trailSlider = document.getElementById("trail");

const addButton = document.getElementById("add");
const resetButton = document.getElementById("reset");
const shareButton = document.getElementById("share");
const removeButton = document.getElementById("remove");

const redField = document.getElementById("r");
const greenField = document.getElementById("g");
const blueField = document.getElementById("b");

const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const { width, height } = canvas;
/** @type {Pendulum[]} */
const pendulums = [];

let running = true;
let mouseDown = false;
let lastSelected = null;
let dragging = null;
let mouse = {
    x: 0,
    y: 0,
};

const pauseButton = new PauseButton(960, 16, 48, (state) => {
    running = state;
    settings.hidden = state;
    if (state) {
        pendulums.forEach((o) =>
            o.parts.forEach((p) => {
                p.accel = 0;
                p.speed = 0;
            })
        );
    }
});

function renderLoop() {
    if (running) pendulums.forEach((obj) => obj.update());
    ctx.clearRect(0, 0, width, height);
    pendulums.forEach((obj) => obj.draw(ctx, running));
    pauseButton.draw(ctx);
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

function updateSettings() {
    if (lastSelected) {
        selectedSettings.hidden = false;
        noneText.hidden = true;

        [redField.value, greenField.value, blueField.value] =
            lastSelected.color;
    } else {
        selectedSettings.hidden = true;
        noneText.hidden = false;
    }
}

canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    mouseDown = true;
    const { x, y } = translateMouse(e, canvas);
    if (lastSelected) lastSelected.selected = false;
    lastSelected = null;
    if (!running) {
        let esc = false;
        const boundingBoxes = pendulums.map((obj) => obj.getBoundingBoxes());
        for (let p = 0; !esc && p < boundingBoxes.length; p += 1) {
            for (let n = 0; !esc && n < boundingBoxes[p].length; n += 1) {
                const [bx, by, br] = boundingBoxes[p][n];
                if (
                    Math.sqrt((bx - x) ** 2 + (by - y) ** 2) < Math.max(br, 10)
                ) {
                    esc = true;
                    dragging = [p, n];
                    lastSelected = pendulums[p];
                    lastSelected.selected = true;
                    trailSlider.value = lastSelected.trailLength;
                }
            }
        }
    }
    updateSettings();
});

canvas.addEventListener("wheel", (e) => {
    if (!running) {
        let found = null;
        const boundingBoxes = pendulums.map((obj) => obj.getBoundingBoxes());
        for (let p = 0; !found && p < boundingBoxes.length; p += 1) {
            for (let n = 0; !found && n < boundingBoxes[p].length; n += 1) {
                const [bx, by, br] = boundingBoxes[p][n];
                if (
                    Math.sqrt((bx - mouse.x) ** 2 + (by - mouse.y) ** 2) <
                    Math.max(br, 10)
                ) {
                    e.preventDefault();
                    found = [p, n];
                }
            }
        }

        if (found) {
            const [p, n] = found;
            const part = pendulums[p].parts[n];
            part.mass = Math.min(
                100,
                Math.max(1, part.mass + e.deltaY * -0.02)
            );
        }
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0 || !mouseDown) return;
    mouseDown = false;

    const { x, y } = translateMouse(e, canvas);
    if (dragging) {
        dragging = null;
    } else if (
        x > pauseButton.x &&
        x < pauseButton.x + pauseButton.w &&
        y > pauseButton.y &&
        y < pauseButton.y + pauseButton.h
    ) {
        pauseButton.click();
    }
});

canvas.addEventListener("mousemove", (e) => {
    mouse = translateMouse(e, canvas);
    if (dragging) {
        const [p, n] = dragging;
        const pendulum = pendulums[p];
        const part = pendulum.parts[n];
        if (n === 0) {
            const nextPart = pendulum.parts[n + 1];
            const startX = 512;
            const startY = 382;

            const nextX =
                startX +
                Math.cos(part.angle + Math.PI / 2) * part.length +
                Math.cos(nextPart.angle + Math.PI / 2) * nextPart.length;
            const nextY =
                startY +
                Math.sin(part.angle + Math.PI / 2) * part.length +
                Math.sin(nextPart.angle + Math.PI / 2) * nextPart.length;

            part.angle =
                Math.atan((startY - mouse.y) / (startX - mouse.x)) -
                Math.PI / 2;
            if (mouse.x < startX) part.angle += Math.PI;
            part.length = Math.sqrt(
                (startX - mouse.x) ** 2 + (startY - mouse.y) ** 2
            );

            nextPart.angle =
                Math.atan((mouse.y - nextY) / (mouse.x - nextX)) - Math.PI / 2;
            if (nextX < mouse.x) nextPart.angle += Math.PI;
            nextPart.length = Math.sqrt(
                (mouse.x - nextX) ** 2 + (mouse.y - nextY) ** 2
            );
        } else if (n === 1) {
            const firstPart = pendulum.parts[n - 1];
            const startX =
                512 +
                Math.cos(firstPart.angle + Math.PI / 2) * firstPart.length;
            const startY =
                382 +
                Math.sin(firstPart.angle + Math.PI / 2) * firstPart.length;

            part.angle =
                Math.atan((startY - mouse.y) / (startX - mouse.x)) -
                Math.PI / 2;
            if (mouse.x < startX) part.angle += Math.PI;
            part.length = Math.sqrt(
                (startX - mouse.x) ** 2 + (startY - mouse.y) ** 2
            );
        }
    }
});

gravitySlider.value = 15;
gravitySlider.addEventListener("input", (e) => {
    const gravity = e.target.value * 0.05;
    pendulums.forEach((p) => (p.gravity = gravity));
});

trailSlider.value = 256;
trailSlider.addEventListener("input", (e) => {
    lastSelected.trailLength = e.target.value;
});

resetButton.addEventListener("click", () => {
    window.location.href = `${window.location.origin}${window.location.pathname}`;
});

shareButton.addEventListener("click", () => {
    const url = `${window.location.origin}${window.location.pathname}#${btoa(
        JSON.stringify({
            g: gravitySlider.value,
            p: pendulums.map((p) => p.toJSON()),
        })
    )}`;
    window.location.href = url;
    copy(url);
});

redField.addEventListener("input", (e) => {
    const val = clamp(0, 255, parseInt(e.target.value, 10));
    lastSelected.color[0] = val;
    e.target.value = val;
});

greenField.addEventListener("input", (e) => {
    const val = clamp(0, 255, parseInt(e.target.value, 10));
    lastSelected.color[1] = val;
    e.target.value = val;
});

blueField.addEventListener("input", (e) => {
    const val = clamp(0, 255, parseInt(e.target.value, 10));
    lastSelected.color[2] = val;
    e.target.value = val;
});

removeButton.addEventListener("click", () => {
    pendulums.splice(
        pendulums.findIndex((p) => p.uuid === lastSelected.uuid),
        1
    );
    lastSelected.selected = false;
    lastSelected = null;
    updateSettings();
});

addButton.addEventListener("click", () => {
    pendulums.push(
        new Pendulum(
            [
                {
                    length: random(100, 200),
                    angle: random(-180, 180),
                    mass: random(10, 50),
                },
                {
                    length: random(100, 200),
                    angle: random(-180, 180),
                    mass: random(10, 50),
                },
            ],
            [random(0, 256), random(0, 256), random(0, 256)]
        )
    );
});

const data = parseEncodedJson(window.location.hash.substr(1));

if (data) {
    pauseButton.click();
    data.p.forEach((p) => {
        pendulums.push(
            new Pendulum(
                p.p.map((n) => ({
                    length: n.l,
                    angle: (n.a / Math.PI) * 180,
                    mass: n.m,
                })),
                p.c,
                p.t
            )
        );
    });
    gravitySlider.value = data.g;
    pendulums.forEach((p) => (p.gravity = data.g * 0.05));
} else {
    pendulums.push(
        new Pendulum(
            [
                {
                    length: 250,
                    angle: 90,
                    mass: 30,
                },
                {
                    length: 250,
                    angle: 120,
                    mass: 10,
                },
            ],
            [255, 0, 0]
        )
    );
}
