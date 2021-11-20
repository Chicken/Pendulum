export class PauseButton {
    /**
     * @callback StateChanger
     * @param {boolean} state current state
     */

    /**
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     * @param {number} w width of the button
     * @param {number} h height of the button
     * @param {StateChanger} stateChanger function to call with toggled state
     */
    constructor(x, y, w, stateChanger) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = w * 1.2;
        this.stateChanger = stateChanger;
        this.state = true;
    }

    click() {
        this.state = !this.state;
        this.stateChanger(this.state);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx canvas to draw on
     */
    draw(ctx) {
        if (this.state) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.w / 3, this.h);
            ctx.rect(this.x + (this.w * 2) / 3, this.y, this.w / 3, this.h);
            ctx.fill();
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.h);
            ctx.lineTo(this.x + this.w, this.y + this.h / 2);
            ctx.lineTo(this.x, this.y);
            ctx.fill();
        }
    }
}
