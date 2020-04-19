export class MyPreloaderScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MyPreloaderScene'
        });
    }

    preload() {
        this.load.image('steak', require('./assets/steak.png'));
        this.add.text(320, 240, 'L O A D I N G').setOrigin(0.5, 0.5);
    }

    create() {
        this.scene.start('MyLoaderScene');
    }
}