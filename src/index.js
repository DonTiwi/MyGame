import Phaser, { Time } from 'phaser';
import MyGame from './MyGame';
import { LevelWoods } from './levelWoods';

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 400,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 500 },
			debug: true,
		},
	},
	scene: [MyGame, LevelWoods],
};
const game = new Phaser.Game(config);
