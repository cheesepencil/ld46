import { MyGameScene } from "./myGameScene";

export class Waddler extends Phaser.GameObjects.Sprite {
    _scene: MyGameScene;
    _tweens: Phaser.Tweens.Tween[] = [];
    _collider: Phaser.Physics.Arcade.Collider;
    _particles: Phaser.GameObjects.Particles.ParticleEmitterManager;
    _emitter: Phaser.GameObjects.Particles.ParticleEmitter;
    _lane: number;

    _isSteak: boolean = false;

    constructor(scene: MyGameScene, x: number, y: number, texture: string, speed: number, delay: number, lane:number) {
        super(scene, x, y, texture);
        this._lane = lane;
        this._scene = scene;
        this.setOrigin(0.5, 1);
        scene.physics.add.existing(this);

        scene.add.existing(this);
        scene._waddlers.add(this);

        (this.body as Phaser.Physics.Arcade.Body)
            .setGravityY(-200)
            .rotation = -0.25;

        this._tweens.push(scene.tweens.add({
            targets: [this],
            duration: speed,
            delay: delay,
            ease: 'linear',
            x: 32,
            onComplete: this.onKillBaby,
            callbackScope: this
        }));
        this._tweens.push(scene.tweens.add({
            targets: [this],
            duration: 75,
            y: this.y - 4,
            yoyo: true,
            repeat: -1
        }));
        this._tweens.push(scene.tweens.add({
            targets: [this],
            yoyo: true,
            repeat: -1,
            duration: 150,
            rotation: 0.25
        }));

        this._collider = scene.physics.add.overlap(this, scene._fireballs, this.onFire, null, this);
    }

    preUpdate() {
        if (this._emitter) {
            this._emitter.setPosition(this.x, this.y - 16);
        };
    }

    onFire() {
        this._isSteak = true;
        this.setTexture('steak');
        this._particles = this.scene.add.particles('smoke');
        this._emitter = this._particles.createEmitter({
            alpha: { start: 1, end: 0 },
            scale: { start: 0.5, end: 2.5 },
            speed: 5,
            accelerationY: -20,
            angle: { min: -75, max: -105 },
            rotate: { min: -180, max: 180 },
            lifespan: { min: 1000, max: 2000 },
            blendMode: 'ADD',
            frequency: 110,
            maxParticles: 10,
            x: this.x,
            y: this.y - 16,
            deathCallback: this.onNotSmoking,
            deathCallbackScope: this
        });
        this._scene.time.delayedCall(500, this.onAddSteakCollider, null, this);

        this._scene.events.emit('steakified');

        this._collider.destroy();
    }

    onAddSteakCollider() {
        this._collider = this.scene.physics.add.overlap(this, this._scene._fireballs, this.onAshify, null, this);
    }

    onNotSmoking() {
        this._particles.destroy();
    }

    onAshify() {
        this._collider.destroy();
        this._particles = this.scene.add.particles('gibs');
        this._emitter = this._particles.createEmitter({
            x: this.x,
            y: this.y - 16,
            angle: { min: -75, max: -115 },
            speed: 100,
            frequency: 100,
            gravityY: 50,
            lifespan: { min: 1000, max: 2000 },
            quantity: 6,
            maxParticles: 20,
            scale: { start: 1, end: 10 },
            blendMode: Phaser.BlendModes.NORMAL,
            rotate: { min: -180, max: 180 },
            alpha: { start: 1, end: 0 },
            deathCallback: this.onAshed,
            deathCallbackScope: this
        });

        this.destroy();
    }

    onAshed() {
        this._particles.destroy();
    }

    onKillBaby() {
        if (this._isSteak) {
            this.scene.events.emit('yummy', this._lane);
            this.destroy();
        }
        else {
            this._tweens.forEach(t => {
                t.stop();
            })
            this.setAngle(-15);
            this._tweens.push(this.scene.tweens.add({
                targets: [this],
                x: this.x + Phaser.Math.Between(16, 32),
                y: this.y - Phaser.Math.Between(16, 32),
                duration: Phaser.Math.Between(75, 125),
                repeat: - 1,
                yoyo: true
            }))
            this.scene.events.emit('gameOver', this._lane);
        }
    }

    destroy() {
        this._tweens.forEach(t => {
            t.stop();
        });
        super.destroy();
    }
}