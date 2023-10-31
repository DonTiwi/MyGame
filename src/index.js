import Phaser, { Time } from 'phaser';
import MyGame from './MyGame';
import { LevelWoods } from './levelWoods';

const config = {
	type: Phaser.AUTO,
	parent: 'MyGame',
	width: 800,
	height: 400,
	scene: MyGame,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 500 },
			debug: true,
		},
	},
};

const game = new Phaser.Game(config);
