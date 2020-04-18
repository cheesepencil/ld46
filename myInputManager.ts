import { InputAggregate } from "./inputAggregate";

export class MyInputManager {
    private _scene: Phaser.Scene;
    private _w_key: Phaser.Input.Keyboard.Key;
    private _s_key: Phaser.Input.Keyboard.Key;
    private _esc_key: Phaser.Input.Keyboard.Key;
    private _pointer: Phaser.Input.Pointer;
    private _using_pad: boolean = false;
    private _charging: number = 0;

    constructor(scene: Phaser.Scene) {
        this._scene = scene;
        this._w_key = scene.input.keyboard.addKey('w');
        this._s_key = scene.input.keyboard.addKey('s');
        this._esc_key = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this._pointer = scene.input.activePointer;
    }

    getInput(): InputAggregate {
        let result: InputAggregate = new InputAggregate();
        result.headVerticalMovement = 0;
        result.headRotation = 0;
        result.reset = false;

        let gamePad = this._scene.input.gamepad;
        let pad = gamePad ? gamePad.pad1 : undefined;
        if (pad) {
            // vertical movement: left stick
            pad.setAxisThreshold(0.25);
            let headMovementAxis = pad.axes[1];
            if (headMovementAxis) {
                let vertValue = headMovementAxis.getValue();
                if (vertValue != 0) this._using_pad = true;
                result.headVerticalMovement = vertValue
                    ? vertValue > 0 ? Math.ceil(vertValue) : Math.floor(vertValue)
                    : 0;
            }
            // vertical movement: right stick
            if (pad.buttons[12] && pad.buttons[13]) {
                if (pad.buttons[12].value > 0) {
                    this._using_pad = true;
                    result.headVerticalMovement = -1;
                }
                if (pad.buttons[13].value > 0) {
                    this._using_pad = true;
                    result.headVerticalMovement = 1;
                }
            }
            // power up attack with right bumper or right trigger
            if (pad.buttons[5] && pad.buttons[7]) {
                if (pad.buttons[5].value > 0.25 || pad.buttons[7].value > 0.25) {
                    this._using_pad = true;
                    result.charging = true;
                }
            }
            // aim head with right stick
            let vertHeadAimAxis = pad.axes[3];
            if (vertHeadAimAxis) {
                this._using_pad = true;
                vertHeadAimAxis.threshold = 0.05;
                result.headRotation = vertHeadAimAxis.getValue();
            }
            // restart scene with hamburger button
            let hamburgerButton = pad.buttons[9];
            if (hamburgerButton && hamburgerButton.value > 0.125) {
                this._using_pad = true;
                result.reset = true;
            }
        }
        // keyboard input
        if (this._w_key.isDown) {
            this._using_pad = false;
            result.headVerticalMovement = -1;
        }
        if (this._s_key.isDown) {
            this._using_pad = false;
            result.headVerticalMovement = 1
        }
        if (this._esc_key.isDown) {
            this._using_pad = false;
            result.reset = true;
        }

        // mouse input (if not using gamepad)
        if (!this._using_pad && this._pointer.isDown) {
            result.charging = true;
        }

        result.usingPad = this._using_pad;
        return result;
    }
}