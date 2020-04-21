export class MyTitleScene extends Phaser.Scene {
    _rope: any;
    _count: number = 0;
    _space_key: Phaser.Input.Keyboard.Key;
    _suppress_input: boolean = true;
    _showing_controls: boolean = false;

    _title: any;
    _ld: any;
    _pressStart: any;
    _attribution: any;

    constructor() {
        super({
            key: 'MyTitleScene'
        });
    }

    create() {
        this.sound.play('introSong');
        this._space_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        const curve = new Phaser.Curves.Spline([
            -24, 240,
            664, 240
        ]);
        const points = curve.getDistancePoints(20);
        this._rope = (this.add as any).rope(0, 32, 'lava', null, points);

        this._ld = this.add.sprite(0, -640, 'ld').setOrigin(0, 0);
        this._attribution = this.add.sprite(0, 640, 'attribution').setOrigin(0, 0);
        this._title = this.add.sprite(320, 240, 'title')
            .setScale(20, 20)
            .setOrigin(0.5, 0.5);
        this._pressStart = this.add.sprite(0, 0, 'pressSpace').setOrigin(0, 0).setAlpha(0);

        this.tweens.add({
            targets: [this._title],
            duration: 3000,
            ease: 'Bounce.easeOut',
            scaleX: 1,
            scaleY: 1,
            repeat: 0
        });
        this.tweens.add({
            targets: [this._attribution, this._ld],
            duration: 2000,
            y: 0,
            delay: 1000,
            repeat: 0
        });
        this.tweens.add({
            targets: [this._pressStart],
            duration: 1000,
            alpha: 1,
            delay: 3000,
            repeat: -1,
            yoyo: true
        })

        this.time.delayedCall(2000, this.onAllowInput, null, this);
    }

    onAllowInput() {
        this._suppress_input = false;
    }

    update() {
        this._count += 0.075;
        let points = this._rope.points;

        for (let i = 0; i < points.length; i++) {
            points[i].y += Math.cos(i * 0.075 + this._count);
        }

        this._rope.setDirty();

        if (!this._suppress_input) {
            let doIt = false;
            let gamePad = this.input.gamepad;
            let pad = gamePad ? gamePad.pad1 : undefined;
            if (pad) {
                // restart scene with hamburger button
                let hamburgerButton = pad.buttons[9];
                if (hamburgerButton && hamburgerButton.value > 0.125) {
                    doIt = true;
                }
            }
            if (this._space_key.isDown) {
                doIt = true;
            }

            if (doIt) {
                this._suppress_input = true;
                if (this._showing_controls) {
                    this.sound.stopAll();
                    this.scene.start('MyGameScene');
                } else {
                    this._showing_controls = true;
                    this.tweens.add({
                        targets: [this._ld, this._attribution, this._title, this._pressStart],
                        y: -1024,
                        alpha: 0,
                        duration: 1000
                    });
                    let controls = this.add.sprite(0, -640, 'controls').setOrigin(0, 0);
                    this.add.tween({
                        targets: [controls],
                        duration: 1000,
                        y: 0
                    });
                    this.time.delayedCall(1000, this.onAllowInput, null, this);
                }
            }
        }
    }
}