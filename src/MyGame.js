import Phaser, { Time } from 'phaser';
import Knight from './Knight';
import { LevelWoods } from './levelWoods';

class MyGame extends Phaser.Scene {
	constructor() {
		super();
		this.screenWidth = 800;
		this.screenHeight = 400;
	}

	preload() {
		const knightContext = require.context(
			'./assets/Knight_1',
			false,
			/\.(png|json)$/
		);

		const levelContext = require.context(
			'./assets/Levels',
			false,
			/\.(png)$/
		);

		this.load.spritesheet('Idle', knightContext('./Idle.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});
		this.load.spritesheet('Jump', knightContext('./Jump.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});

		this.load.spritesheet('Run', knightContext('./Run.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});

		this.load.spritesheet('Hanging', knightContext('./Hanging.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});
		this.load.spritesheet('Roll', knightContext('./Roll.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});

		this.load.spritesheet(
			'CrouchIdle',
			knightContext('./crouch_idle.png'),
			{
				frameWidth: 128,
				frameHeight: 64,
			}
		);

		this.load.image('Level_1', levelContext('./Level_1.png'));

		const levelWoodsContext = require.context(
			'./assets/oak_woods',
			true,
			/\.(png)$/
		);

		const backgroundContext = require.context(
			'./assets/oak_woods/background',
			false,
			/\.(png)$/
		);

		this.load.image(
			'background1',
			backgroundContext('./background_layer_1.png')
		);
		this.load.image(
			'background2',
			backgroundContext('./background_layer_2.png')
		);
		this.load.image(
			'background3',
			backgroundContext('./background_layer_3.png')
		);
		this.load.spritesheet(
			'oak_woods_tileset_Custom',
			levelWoodsContext('./oak_woods_tileset_Custom.png'),
			{
				frameWidth: 32,
				frameHeight: 32,
			}
		);
	}

	create() {
		this.createAnimations();

		this.debugGraphics = this.add.graphics({
			fillStyle: {
				color: this.controlsEnabled ? 0xff0000 : 0xff0000,
			},
		});

		this.edgeBlocks = [];

		this.collisionBlocks = this.physics.add.group({
			allowGravity: false,
			immovable: true,
		});
		this.levelWoods = new LevelWoods(
			this,
			this.screenWidth,
			this.screenHeight,
			this.collisionBlocks,
			this.edgeBlocks
		);

		this.levelWoods.create();

		this.knight = new Knight(this, this.edgeBlocks); // Pass edgeBlocks array here

		this.physics.add.collider(this.knight.knight, this.collisionBlocks);
		this.physics.add.collider(this.knight.knight, this.collisionBlocks);

		this.physics.add.collider(this.knight.knight, this.collisionBlocks);
	}

	createAnimations() {
		this.anims.create({
			key: 'knightIdle',
			frames: this.anims.generateFrameNumbers('Idle', {
				start: 0,
				end: 3,
			}),
			frameRate: 3,
			repeat: -1,
		});

		this.anims.create({
			key: 'knightJump',
			frames: this.anims.generateFrameNames('Jump', {
				start: 0,
				end: 3,
			}),
			frameRate: 2,
			repeat: 0,
		});

		this.anims.create({
			key: 'KnightRun',
			frames: this.anims.generateFrameNumbers('Run', {
				start: 0,
				end: 3,
			}),
			frameRate: 15,
			repeat: -1,
		});

		this.anims.create({
			key: 'KnightRoll',
			frames: this.anims.generateFrameNumbers('Roll', {
				start: 0,
				end: 3,
				repeat: -1,
			}),
			frameRate: 15,
			repeat: 0,
		});

		this.anims.create({
			key: 'Hanging',
			frames: this.anims.generateFrameNumbers('Hanging', {
				start: 0,
				end: 3,
			}),
			frameRate: 5,
			repeat: -1,
		});

		this.anims.create({
			key: 'CrouchIdle',
			frames: this.anims.generateFrameNumbers('CrouchIdle', {
				start: 0,
				end: 3,
			}),
			frameRate: 3,
			repeat: -1,
		});
	}

	update() {
		this.knight.update();
		this.levelWoods.update();
	}
}

export default MyGame;
