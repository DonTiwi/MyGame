import Phaser from 'phaser';
import MyGame from './MyGame';

const config = {
	type: Phaser.AUTO,
	parent: 'MyGame',
	width: 800,
	height: 400,
	backgroundColor: '#5c94fc',
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
