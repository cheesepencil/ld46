export class MyLoaderScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MyLoaderScene'
        });
    }

    preload() {
        let steakBouncer = this.add.sprite(320, 240, 'steak');
        steakBouncer.setAngle(25)
        this.add.tween({
            targets: [steakBouncer],
            y: steakBouncer.y - 16,
            yoyo: true,
            repeat: -1,
            ease: 'Back.easeInOut',
            duration: 500
        })
        this.add.tween({
            targets: [steakBouncer],
            angle: -25,
            yoyo: true,
            repeat: -1,
            duration: 300
        })

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
    }

    create() {
        this.time.delayedCall(1000, this.onGoToTitle, null, this);
    }

    onGoToTitle() {
        this.scene.start('MyTitleScene');
    }
}