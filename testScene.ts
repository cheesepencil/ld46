import { MyInputManager } from "./myInputManager";
import { Physics, GameObjects } from "phaser";
import { Waddler } from "./waddler";

type TweenConfig = Phaser.Types.Tweens.TweenBuilderConfig;

export class TestScene extends Phaser.Scene {
    // input aggregator
    _myInputManager: MyInputManager;

    // dragon head
    _dragonHeadSprite: Phaser.GameObjects.Sprite;
    _dragonHeadBody: Physics.Arcade.Body;
    _drag = 0.95;               // physics setting
    _moveMoventSpeed = 50;      // physics setting
    _maxVelocity = 150;         // physics setting
    _chargeSpeed = 30;          // gameplay setting
    _charge = 0;                // gameplay var
    _lastSpew = 0;              // gameplay var

    // fireballs
    _fireballs: Phaser.Physics.Arcade.Group;
    _minFireballVelocity = 200;
    _maxFireballVelocity = 1000;

    // waddlers
    _waddlers: Phaser.Physics.Arcade.Group;

    // game status
    _wave: number = 1;
    _gameOver: boolean = false;
    _waveCleared: boolean = false;

    constructor() {
        super({ key: 'TitleScene' });
    }

    preload(): void {
        this.load.image('test', require('./assets/test.png'));
        this.load.image('background', require('./assets/background.png'));
        this.load.image('knight', require('./assets/knight.png'));
        this.load.image('steak', require('./assets/steak.png'));
        this.load.image('smoke', require('./assets/smoke.png'));
        this.load.image('gibs', require('./assets/gibs.png'));
    }

    create(): void {
        this.add.image(0, 0, 'background').setOrigin(0, 0);
        this._dragonHeadSprite = this.add.sprite(128, 400, 'test')
            .setOrigin(0.125, 0.5);
        let dragonHead = this.physics.add.existing(this._dragonHeadSprite);
        this._dragonHeadBody = (dragonHead.body as Physics.Arcade.Body)
            .setGravityY(-200)
            .setCollideWorldBounds(true, 0, 1)
            .setMaxVelocity(0, this._maxVelocity)
            .setDragY(this._drag);
        this._dragonHeadBody.useDamping = true;

        this._fireballs = new Phaser.Physics.Arcade.Group(this.physics.world, this);
        this._waddlers = new Phaser.Physics.Arcade.Group(this.physics.world, this);

        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        this.startWave();

        this._myInputManager = new MyInputManager(this, this._dragonHeadSprite);

        this.events.addListener('gameOver', this.onGameOver, this);
        this.events.addListener('steakified', this.onSteakified, this);
    }

    update(time: number, delta: number): void {
        // input
        let myInput = this._myInputManager.getInput();
        if (myInput.reset) {
            this.scene.restart();
        }
        if (!this._gameOver) {
            if (myInput.headVerticalMovement) {
                this._dragonHeadBody.setVelocityY(
                    this._dragonHeadBody.velocity.y +
                    (myInput.headVerticalMovement * this._moveMoventSpeed));
            }
            this._dragonHeadSprite.angle = 90 * myInput.headRotation;
            if (myInput.charging && time > (this._lastSpew + 1000)) {
                let oldCharge = this._charge;
                let newCharge = this._charge + (this._chargeSpeed / delta);
                this._charge = newCharge > 100 ? 100 : newCharge;

                let newColor = Phaser.Display.Color
                    .ValueToColor(this._dragonHeadSprite.tintTopLeft);
                newColor.blue = 255 - Math.ceil(255 * (this._charge / 100));
                newColor.green = 255 - Math.ceil(255 * (this._charge / 100));

                this._dragonHeadSprite.tint = newColor.color;
            } else if (this._charge > 0) {
                this._lastSpew = time;
                this._dragonHeadSprite.tint = 0xffffff;

                let fireballCircle = this.add.circle(this._dragonHeadSprite.x, this._dragonHeadSprite.y, 8, 0xff0000);
                this._fireballs.add(fireballCircle);

                // math!
                let diff = this._maxFireballVelocity - this._minFireballVelocity;
                let fireballVelocity = this._minFireballVelocity + Math.ceil((diff * (this._charge / 100)));
                let fireballBody = (fireballCircle.body as Physics.Arcade.Body)
                    .setCollideWorldBounds();
                fireballBody.onWorldBounds = true;

                this.physics.velocityFromAngle(this._dragonHeadSprite.angle, fireballVelocity, fireballBody.velocity)

                this._charge = 0;
            }
        }
    }

    onWorldBounds(body: Physics.Arcade.Body) {
        // clean up stray fireballs
        let fireballs = this._fireballs.getChildren();
        let fireballFilter = fireballs.filter(f => f.body === body);
        if (fireballFilter) {
            let fireball = fireballFilter[0];
            this._fireballs.killAndHide(fireball);
            fireball.destroy();
        }
    }

    onGameOver() {
        this._dragonHeadBody.setGravityY(300);
        this.tweens.add({
            targets: [this._dragonHeadSprite],
            duration: 1000,
            angle: 60
        });
        this._gameOver = true;
        console.log('Game over, man!');
    }

    startWave() {
        this._waveCleared = false;
        if (this._wave === 1) {
            console.log('Wave 1');
            for (let i = 0; i < 15; i++) {
                this.addRandomWaddler(Phaser.Math.Between(2500, 3500) * i);
            }
        }
        else if (this._wave === 2) {
            console.log('Wave 2');
            for (let i = 0; i < 25; i++) {
                this.addRandomWaddler(Phaser.Math.Between(1500, 3000) * i);
            }
        }
        else if (this._wave === 3) {
            console.log('Wave 3');
            for (let i = 0; i < 40; i++) {
                this.addRandomWaddler(Phaser.Math.Between(500, 2000) * i);
            }
        }
    }

    addRandomWaddler(delay: number) {
        let yPositions = [160, 300, 450];
        let difficulty = [[15000, 30000], [5000, 15000], [3000, 10000]];
        new Waddler(
            this,
            656,
            yPositions[Phaser.Math.Between(0, 2)],
            'knight',
            Phaser.Math.Between(difficulty[this._wave - 1][0], difficulty[this._wave - 1][1]),
            delay);
    }

    onSteakified() {
        if (!this._waveCleared) {
            let waddlers = this._waddlers.getChildren() as Waddler[];
            let unsteaked = waddlers.filter(w => w._isSteak === false);
            if (unsteaked.length === 0) {
                this._waveCleared = true;
                this._wave++;
                console.log('Gonna start a new wave!');
                this.time.delayedCall(2000, this.startWave, null, this);
            }
        }
    }
}
