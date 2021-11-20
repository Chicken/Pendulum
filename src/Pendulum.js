import { uuidv4 } from "./util.js";

export class Pendulum {
    /**
     * @typedef Part
     * @property {number} angle angle of the part
     * @property {number} length length of the part
     * @property {number} mass mass of the part
     * @property {number?} accel rotational acceleration
     * @property {number?} speed rotational speed
     */

    /**
     * @param {Part[]} parts array of parts
     * @param {[number, number, number]?} color rgb color
     * @param {number?} trailLength length of trail in timeframes
     */
    constructor(parts, color, trailLength = 256) {
        this.color = color;
        if (parts.length !== 2)
            throw new Error("Only two parts supported at the moment");
        this.parts = parts.map((p) => {
            p.angle = (p.angle / 180) * Math.PI;
            p.speed = 0;
            p.accel = 0;
            return p;
        });
        this.trail = [];
        this.trailLength = trailLength;
        this.nodes = [];
        this.gravity = 0.75;
        this.selected = false;
        this.uuid = uuidv4();
    }

    update() {
        // just don't touch this...
        this.parts[0].accel =
            (-this.gravity *
                (2 * this.parts[0].mass + this.parts[1].mass) *
                Math.sin(this.parts[0].angle) +
                -this.parts[1].mass *
                    this.gravity *
                    Math.sin(this.parts[0].angle - 2 * this.parts[1].angle) +
                -2 *
                    Math.sin(this.parts[0].angle - this.parts[1].angle) *
                    this.parts[1].mass *
                    (this.parts[1].speed ** 2 * this.parts[1].length +
                        this.parts[0].speed ** 2 *
                            this.parts[0].length *
                            Math.cos(
                                this.parts[0].angle - this.parts[1].angle
                            ))) /
            (this.parts[0].length *
                (2 * this.parts[0].mass +
                    this.parts[1].mass -
                    this.parts[1].mass *
                        Math.cos(
                            2 * this.parts[0].angle - 2 * this.parts[1].angle
                        )));
        this.parts[1].accel =
            (2 *
                Math.sin(this.parts[0].angle - this.parts[1].angle) *
                (this.parts[0].speed ** 2 *
                    this.parts[0].length *
                    (this.parts[0].mass + this.parts[1].mass) +
                    this.gravity *
                        (this.parts[0].mass + this.parts[1].mass) *
                        Math.cos(this.parts[0].angle) +
                    this.parts[1].speed ** 2 *
                        this.parts[1].length *
                        this.parts[1].mass *
                        Math.cos(this.parts[0].angle - this.parts[1].angle))) /
            (this.parts[1].length *
                (2 * this.parts[0].mass +
                    this.parts[1].mass -
                    this.parts[1].mass *
                        Math.cos(
                            2 * this.parts[0].angle - 2 * this.parts[1].angle
                        )));

        this.parts[0].speed += this.parts[0].accel;
        this.parts[1].speed += this.parts[1].accel;
        this.parts[0].angle += this.parts[0].speed;
        this.parts[1].angle += this.parts[1].speed;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx canvas to draw on
     * @param {boolean} running if the pendulum is still running
     */
    draw(ctx, running) {
        if (!running) this.trail = [];
        if (running) this.trail.splice(this.trailLength);
        if (running)
            this.trail.forEach(([x, y], i) => {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${this.color.join(", ")}, ${(
                    (this.trailLength - i) /
                    this.trailLength
                ).toFixed(2)})`;
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.stroke();
            });

        if (this.selected) {
            ctx.lineWidth = 14;
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgb(255, 255, 255)";
            let x = 512;
            let y = 382;
            const nodes = [];
            ctx.beginPath();
            this.parts.forEach((part) => {
                ctx.moveTo(x, y);
                x += Math.cos(part.angle + Math.PI / 2) * part.length;
                y += Math.sin(part.angle + Math.PI / 2) * part.length;
                ctx.lineTo(x, y);
                nodes.push([x, y, part.mass]);
            });
            ctx.stroke();
            nodes.forEach(([nodeX, nodeY, mass]) => {
                ctx.beginPath();
                ctx.arc(nodeX, nodeY, mass + 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        ctx.lineWidth = 8;
        ctx.strokeStyle = `rgb(${this.color.join(", ")})`;
        ctx.fillStyle = `rgb(${this.color.join(", ")})`;
        let x = 512;
        let y = 382;
        const nodes = [];
        ctx.beginPath();
        this.parts.forEach((part) => {
            ctx.moveTo(x, y);
            x += Math.cos(part.angle + Math.PI / 2) * part.length;
            y += Math.sin(part.angle + Math.PI / 2) * part.length;
            ctx.lineTo(x, y);
            nodes.push([x, y, part.mass]);
        });
        ctx.stroke();
        nodes.forEach(([nodeX, nodeY, mass]) => {
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, mass, 0, 2 * Math.PI);
            ctx.fill();
        });
        this.nodes = nodes;
        if (running) this.trail.unshift([x, y]);
    }

    /**
     * Array as x, y and radius
     * @typedef BoundingBall
     * @type {[number, number, number]}
     */

    /**
     * Yes, they are actually balls
     * @returns {BoundingBall[]} bounding balls
     */
    getBoundingBoxes() {
        return this.nodes;
    }

    toJSON() {
        return {
            c: this.color,
            t: this.trailLength,
            p: this.parts.map((p) => ({
                l: p.length,
                m: p.mass,
                a: p.angle,
            })),
        };
    }
}
