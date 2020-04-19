import './phaser.min.js';
import { MyGame } from './myGame';
import { MyGameConfig } from './gameConfig';

window.onload = () => {
    let game = new MyGame(MyGameConfig);
}