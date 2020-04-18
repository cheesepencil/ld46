import { MyInputManager } from "./myInputManager";
import { Physics, GameObjects } from "phaser";

export class TestScene extends Phaser.Scene {
    // input aggregator
    _myInputManager: MyInputManager;

    // dragon head
    _dragonHeadSprite: Phaser.GameObjects.Sprite;
    _dragonHeadBody: Physics.Arcade.Body;
    _drag = 0.80;               // physics setting
    _moveMoventSpeed = 50;      // physics setting
    _maxVelocity = 300;         // physics setting
    _chargeSpeed = 150;           // gameplay setting
    _charge = 0;                // gameplay var
    _minFireballVelocity = 300;
    _maxFireballVelocity = 1000;

    _fireballs: Phaser.Physics.Arcade.Group;

    constructor() {
        super({ key: 'TitleScene' });
    }

    preload(): void {
        this.load.image('test', require('./assets/test.png'));
    }

    create(): void {
        this._myInputManager = new MyInputManager(this);
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

        this.physics.world.on('worldbounds', this.onWorldBounds, this);
    }

    update(time: number, delta: number): void {
        // input
        let myInput = this._myInputManager.getInput();
        if (myInput.headVerticalMovement) {
            console.log(myInput.headVerticalMovement);
            this._dragonHeadBody.setVelocityY(
                this._dragonHeadBody.velocity.y +
                (myInput.headVerticalMovement * this._moveMoventSpeed));
        }
        this._dragonHeadSprite.angle = 90 * myInput.headRotation;
        if (myInput.charging) {
            let oldCharge = this._charge;
            let newCharge = this._charge + (this._chargeSpeed / delta);
            this._charge = newCharge > 100 ? 100 : newCharge;

            let newColor = Phaser.Display.Color
                .ValueToColor(this._dragonHeadSprite.tintTopLeft);
            newColor.blue = 255 - Math.ceil(255 * (this._charge / 100));
            newColor.green = 255 - Math.ceil(255 * (this._charge / 100));

            this._dragonHeadSprite.tint = newColor.color;
        } else if (this._charge > 0) {
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

        if (myInput.reset){
            this.scene.restart();
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
}