export class MyLoaderScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MyLoaderScene'
        });
    }

    preload() {
        this.add.text(320, 280, 'L O A D I N G').setOrigin(0.5, 0.5);
        let steakBouncer = this.add.sprite(320, 240, 'steak');
        steakBouncer.setAngle(25)
        this.add.tween({
            targets: [steakBouncer],
            y: steakBouncer.y - 24,
            yoyo: true,
            repeat: -1,
            ease: 'Back.easeOut',
            duration: 500
        })
        this.add.tween({
            targets: [steakBouncer],
            angle: -25,
            yoyo: true,
            repeat: -1,
            duration: 300
        })

        // music
        this.load.audio('gameSong', require('./audio/gameplaysong.wav'));
        this.load.audio('introSong', require('./audio/introsong.wav'));

        // images
        this.load.image('test', require('./assets/test.png'));
        this.load.image('background', require('./assets/background.png'));
        this.load.image('knight', require('./assets/knight.png'));
        this.load.image('smoke', require('./assets/smoke.png'));
        this.load.image('gibs', require('./assets/gibs.png'));
        this.load.image('dwaggie', require('./assets/dwaggie.png'));
        this.load.image('gameOver', require('./assets/gameOver.png'));
        this.load.image('youWin', require('./assets/youWin.png'));
        this.load.image('firstWave', require('./assets/firstWave.png'));
        this.load.image('secondWave', require('./assets/secondWave.png'));
        this.load.image('finalWave', require('./assets/finalWave.png'));
        this.load.image('neck', require('./assets/neck.png'));
        this.load.image('lava', require('./assets/lava.png'));
        this.load.image('ld', require('./assets/ld.png'));
        this.load.image('attribution', require('./assets/attribution.png'));
        this.load.image('title', require('./assets/title.png'));
        this.load.image('pressSpace', require('./assets/pressSpace.png'));
        this.load.image('controls', require('./assets/controls.png'));
        this.load.image('fireball', require('./assets/fireball.png'));

        // sounds
        this.load.audio('ashify', require('./audio/ashify.wav'));
        this.load.audio('gameOverSound', require('./audio/gameover.wav'));
        this.load.audio('knightSound', require('./audio/knight.wav'));
        this.load.audio('powerupSound', require('./audio/powerup.wav'));
        this.load.audio('spewSound', require('./audio/spew.wav'));
        this.load.audio('steakifySound', require('./audio/steakify.wav'));
        this.load.audio('yummy1', require('./audio/yummy1.wav'));
        this.load.audio('yummy2', require('./audio/yummy2.wav'));
        this.load.audio('yummy3', require('./audio/yummy3.wav'));
        this.load.audio('yummy4', require('./audio/yummy4.wav'));

    }

    create() {
        this.time.delayedCall(1000, this.onGoToTitle, null, this);
    }

    onGoToTitle() {
        this.scene.start('MyTitleScene');
    }
}