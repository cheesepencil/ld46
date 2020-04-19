import { TestScene } from "./TestScene";

type GameConfig = Phaser.Types.Core.GameConfig;

let fps = 60;

export const MyGameConfig: GameConfig = {
    type: Phaser.AUTO,
    input: {
        gamepad: true,
        keyboard: true
    },
    render: {
        antialias: false
    },
    scale: {
        mode: Phaser.Scale.FIT
    },
    parent: 'game-parent',
    physics: {
        default: 'arcade',
        arcade: {
            //debug: true,
            gravity: { y: 200 },
            fps: fps
        }
    },
    width: 640,
    height: 480,
    fps: {
        target: fps,
        forceSetTimeOut: true
    },
    scene: [TestScene]
};