import { MyInputManager } from "./myInputManager";
import { Physics, GameObjects } from "phaser";
import { Waddler } from "./waddler";

type TweenConfig = Phaser.Types.Tweens.TweenBuilderConfig;

export class MyGameScene extends Phaser.Scene {
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

    // dragon neck
    _neck: any;                 // no types?

    // fireballs
    _fireballs: Phaser.Physics.Arcade.Group;
    _minFireballVelocity = 200;
    _maxFireballVelocity = 1000;
    _fireballSmokeManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
    _throatSmokeManager: Phaser.GameObjects.Particles.ParticleEmitterManager;

    // waddlers
    _waddlers: Phaser.Physics.Arcade.Group;

    // dwaggies
    _topDwaggie: Phaser.GameObjects.Sprite;
    _topDwaggieDead: boolean = false;
    _midDwaggie: Phaser.GameObjects.Sprite;
    _midDwaggieDead: boolean = false;
    _botDwaggie: Phaser.GameObjects.Sprite;
    _botDwaggieDead: boolean = false;

    // game status
    _wave: number = 1;
    _gameOver: boolean = false;
    _waveCleared: boolean = false;

    // sound
    _yummySound: Phaser.Sound.BaseSound;
    _powerupSound: Phaser.Sound.BaseSound;
    _soundVolume: number = 0.2;

    constructor() {
        super({ key: 'MyGameScene' });
    }

    preload(): void {

    }

    create(): void {
        this._gameOver = false;
        this._waveCleared = false;
        this._wave = 1;
        this._topDwaggieDead = false;
        this._midDwaggieDead = false;
        this._botDwaggieDead = false;
        this._charge = 0;
        this._lastSpew = 0;

        this._throatSmokeManager = undefined;
        this._fireballSmokeManager = undefined;

        this.add.image(0, 0, 'background').setOrigin(0, 0);

        this._dragonHeadSprite = this.add.sprite(128, 100, 'test')
            .setOrigin(0.125, 0.5)
            .setDepth(3);
        let dragonHead = this.physics.add.existing(this._dragonHeadSprite);
        this._dragonHeadBody = (dragonHead.body as Physics.Arcade.Body)
            .setGravityY(-200)
            .setCollideWorldBounds(true, 0, 1)
            .setMaxVelocity(0, this._maxVelocity)
            .setDragY(this._drag);
        this._dragonHeadBody.useDamping = true;

        // throat particles
        if (!this._throatSmokeManager) {
            this._throatSmokeManager = this.add.particles('smoke');
        } else {
            this._throatSmokeManager.emitters.shutdown();
        }
        let throatSmoke = this._throatSmokeManager.createEmitter({
            x: { onEmit: () => this._dragonHeadBody.x },
            y: { onEmit: () => this._dragonHeadBody.y + 32 },
            angle: { onEmit: () => this._dragonHeadBody.rotation },
            speed: 500,
            frequency: 0.5,
            //gravityY: 50,
            lifespan: { min: 250, max: 500 },
            maxParticles: 2000,
            scale: {
                onEmit: () => { return 0.25 },
                onUpdate: () => { return (this._charge / 100) * 1.5 }
            },
            tint: {
                onUpdate: () => {
                    let sat = 255 * (this._charge / 100);
                    let newColor = new Phaser.Display.Color(sat, sat, 0);
                    return newColor.color;
                }
            },
            blendMode: Phaser.BlendModes.DARKEN,
            rotate: { min: -180, max: 180 },
            alpha: { start: 1, end: 0 }
        });

        // neck stuff
        let points = this.recalculateNeck();
        this._neck = (this.add as any).rope(0, 0, 'neck', null, points);
        this._neck.setHorizontal();
        this._neck.flipY = true;
        this._neck.flipX = true;
        this._neck.setDepth(2);

        this._fireballs = new Phaser.Physics.Arcade.Group(this.physics.world, this);
        this._waddlers = new Phaser.Physics.Arcade.Group(this.physics.world, this);

        this._topDwaggie = this.add.sprite(24, 160 - 24, 'dwaggie');
        this._midDwaggie = this.add.sprite(24, 300 - 24, 'dwaggie');
        this._botDwaggie = this.add.sprite(24, 450 - 24, 'dwaggie');

        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        // audio
        this._powerupSound = this.sound.add('powerupSound', { volume: this._soundVolume });

        // Game is starting now
        this.startWave();

        this._myInputManager = new MyInputManager(this, this._dragonHeadSprite);
        this.events.addListener('gameOver', this.onGameOver, this);
        this.events.addListener('steakified', this.onSteakified, this);
        this.events.addListener('yummy', this.onYummy, this);
    }

    update(time: number, delta: number): void {
        // input
        let myInput = this._myInputManager.getInput();
        if (myInput.reset) {
            if (this._fireballSmokeManager) {
                this._fireballSmokeManager.emitters.shutdown();
            }
            if (this._throatSmokeManager) {
                this._throatSmokeManager.emitters.shutdown();
            }
            this.sound.stopAll();
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
                if (this._charge !== 100 && this._powerupSound.isPlaying === false) {
                    this._powerupSound.play({ volume: this._soundVolume });
                }
            } else if (this._charge > 0) {
                this._lastSpew = time;
                this._dragonHeadSprite.tint = 0xffffff;

                this._powerupSound.stop();
                this.sound.play('spewSound', { volume: this._soundVolume });

                let fireballSprite = this.add
                    .sprite(this._dragonHeadSprite.x, this._dragonHeadSprite.y + 8, 'fireball')
                    .setOrigin(0.5, 0.5);
                this._fireballs.add(fireballSprite);
                this.add.tween({
                    targets: [fireballSprite],
                    duration: 300,
                    repeat: -1,
                    angle: 360,
                });

                // smokey fireballs!
                if (!this._fireballSmokeManager) {
                    this._fireballSmokeManager = this.add.particles('fireball');
                }
                this._fireballSmokeManager.createEmitter({
                    alpha: { start: 1, end: 0 },
                    scale: { start: 0.95, end: 4 },
                    speed: 0,
                    rotate: { min: -180, max: 180 },
                    lifespan: { min: 250, max: 500 },
                    blendMode: 'ADD',
                    frequency: 0.001,
                    maxParticles: 2000,
                    x: { onEmit: () => { return fireballSprite.x } },
                    y: { onEmit: () => { return fireballSprite.y } }
                })

                // math!
                let diff = this._maxFireballVelocity - this._minFireballVelocity;
                let fireballVelocity = this._minFireballVelocity + Math.ceil((diff * (this._charge / 100)));
                let fireballBody = (fireballSprite.body as Physics.Arcade.Body)
                    .setCollideWorldBounds();
                fireballBody.onWorldBounds = true;

                this.physics.velocityFromAngle(this._dragonHeadSprite.angle, fireballVelocity, fireballBody.velocity)

                this._charge = 0;
            }
        }

        // neck stuff
        let points = this.recalculateNeck();
        this._neck.setPoints(points);
    }

    onWorldBounds(body: Physics.Arcade.Body) {
        // clean up stray fireballs
        let fireballs = this._fireballs.getChildren();
        let fireballFilter = fireballs.filter(f => f.body === body);
        if (fireballFilter) {
            this.time.delayedCall(500, () => {
                if (this._fireballSmokeManager) {
                    this._fireballSmokeManager.emitters.shutdown();
                }
            }, null, this);

            let fireball = fireballFilter[0];
            this._fireballs.killAndHide(fireball);
            fireball.destroy();
        }
    }

    onGameOver(lane: number) {
        let dwaggie;
        if (lane === 0) {
            dwaggie = this._topDwaggie;
            if (!this._topDwaggieDead) {
                this._topDwaggieDead = true;
                this.add.tween({
                    targets: [dwaggie],
                    rotation: 360,
                    repeat: -1
                });
            }
        } else if (lane === 1) {
            dwaggie = this._midDwaggie;
            if (!this._midDwaggieDead) {
                this._midDwaggieDead = true;
                this.add.tween({
                    targets: [dwaggie],
                    rotation: 360,
                    repeat: -1
                });
            }
        } else if (lane === 2) {
            dwaggie = this._botDwaggie;
            if (!this._botDwaggieDead) {
                this._botDwaggieDead = true;
                this.add.tween({
                    targets: [dwaggie],
                    rotation: 360,
                    repeat: -1
                });
            }
        }
        let angle = Phaser.Math.Between(-100, 0);
        let offsetX = Phaser.Math.Between(-20, 20);
        let offsetY = Phaser.Math.Between(-20, 20);
        let particles = this.add.particles('gibs');
        let emitter = particles.createEmitter({
            x: dwaggie.x + offsetX,
            y: dwaggie.y - offsetY,
            angle: { min: angle, max: angle + 2 },
            speed: 100,
            frequency: 2,
            gravityY: 100,
            lifespan: { min: 1000, max: 2000 },
            //quantity: 6,
            maxParticles: 100,
            scale: { start: 1, end: 5 },
            blendMode: Phaser.BlendModes.NORMAL,
            rotate: { min: -180, max: 180 },
            alpha: { start: 1, end: 0 },
        });

        if (!this._gameOver) {
            this.sound.stopAll();
            this.sound.play('gameOverSound');
            this._dragonHeadBody.setGravityY(300);
            this.tweens.add({
                targets: [this._dragonHeadSprite],
                duration: 1000,
                angle: 60
            });
            let gameOver = this.add.sprite(0, 480, 'gameOver').setOrigin(0, 0).setDepth(10);
            this.add.tween({
                targets: [gameOver],
                y: 0,
                duration: 3000,
                ease: 'Bounce.easeOut'
            })
            this._gameOver = true;
        }
    }

    onYummy(lane: number) {
        if (!this._gameOver) {
            let dwaggie: GameObjects.Sprite;
            if (lane === 0) {
                dwaggie = this._topDwaggie;
                dwaggie.y = 160 - 24;
            } else if (lane === 1) {
                dwaggie = this._midDwaggie;
                dwaggie.y = 300 - 24;
            } else if (lane === 2) {
                dwaggie = this._botDwaggie;
                dwaggie.y = 450 - 24;
            }

            if (this._yummySound) {
                if (this._yummySound.isPlaying === false) {
                    this._yummySound = this.sound.add(`yummy${Phaser.Math.Between(1, 4)}`);
                    this._yummySound.play();
                }
            } else {
                this._yummySound = this.sound.add(`yummy${Phaser.Math.Between(1, 4)}`);
                this._yummySound.play();
            }

            this.add.tween({
                targets: [dwaggie],
                y: dwaggie.y - 48,
                duration: 300,
                repeat: 3,
                yoyo: true,
                ease: 'Bounce.easeOut',
            });
        }
    }

    startWave() {
        this.sound.play('gameSong');
        this._waveCleared = false;
        if (this._wave === 1) {
            let firstWave = this.add.sprite(0, 640, 'firstWave').setOrigin(0, 0).setDepth(10);
            this.add.tween({
                targets: [firstWave],
                y: -640,
                duration: 4000
            });
            // 15
            for (let i = 0; i < 15; i++) {
                this.addRandomWaddler(Phaser.Math.Between(2500, 3500) * i);
            }
        }
        else if (this._wave === 2) {
            let secondWave = this.add.sprite(0, 640, 'secondWave').setOrigin(0, 0).setDepth(10);
            this.add.tween({
                targets: [secondWave],
                y: -640,
                duration: 4000
            });
            // 25
            for (let i = 0; i < 25; i++) {
                this.addRandomWaddler(Phaser.Math.Between(1500, 3000) * i);
            }
        }
        else if (this._wave === 3) {
            let thirdWave = this.add.sprite(0, 640, 'finalWave').setOrigin(0, 0).setDepth(10);
            this.add.tween({
                targets: [thirdWave],
                y: -640,
                duration: 4000
            });
            // 40
            for (let i = 0; i < 40; i++) {
                this.addRandomWaddler(Phaser.Math.Between(500, 2000) * i);
            }
        }
    }

    addRandomWaddler(delay: number) {
        let lane = Phaser.Math.Between(0, 2);
        let yPositions = [160, 300, 450];
        let difficulty = [[15000, 30000], [5000, 15000], [3000, 10000]];
        new Waddler(
            this,
            656,
            yPositions[lane],
            'knight',
            Phaser.Math.Between(difficulty[this._wave - 1][0], difficulty[this._wave - 1][1]),
            delay,
            lane);
    }

    onSteakified() {
        if (!this._waveCleared) {
            let waddlers = this._waddlers.getChildren() as Waddler[];
            let unsteaked = waddlers.filter(w => w._isSteak === false);
            if (unsteaked.length === 0) {
                this._waveCleared = true;
                this._wave++;
                if (this._wave === 4) {
                    let youWin = this.add.sprite(0, -480, 'youWin').setOrigin(0, 0).setDepth(10);
                    this.add.tween({
                        targets: [youWin],
                        y: 0,
                        duration: 3000,
                        ease: 'Bounce.easeOut'
                    })
                } else {
                    this.time.delayedCall(2000, this.startWave, null, this);
                }
            }
        }
    }

    recalculateNeck(): any {
        const curve = new Phaser.Curves.Spline([
            new Phaser.Math.Vector2(this._dragonHeadBody.x + 16, this._dragonHeadBody.y + 32),
            new Phaser.Math.Vector2(this._dragonHeadBody.x - 64, this._dragonHeadBody.y),
            new Phaser.Math.Vector2(-16, 240)
        ]);

        //  We'll divide the curve into points:
        return curve.getDistancePoints(5);
    }
}
