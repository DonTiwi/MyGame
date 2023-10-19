import Phaser, { Time } from 'phaser';
import Coin from './assets/Coin/Coin';
class MyGame extends Phaser.Scene {
	constructor() {
		super();
		this.lastDirection = 'Right';
		this.runState = 0;
		this.runTimer = 0;
		this.canJump = true;
		this.controlsEnabled = true;
		this.knightIsHanging = false;
		this.hangingBlock = null;
		this.grabCooldownDuration = 2000;
		this.lastGrabTime = 0;
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

		this.load.image('Level_1', levelContext('./Level_1.png'));
	}

	create() {
		this.debugGraphics = this.add.graphics({
			// set the fill color based on whether controls are enabled or not
			fillStyle: {
				color: this.controlsEnabled ? 0xff0000 : 0xff0000,
			},
		});

		this.createAnimations();
		this.initializeKnight();
		this.initializeControls();

		this.canRoll = true; // flag to check if player can initiate a roll
		this.rollCooldown = null; // timer to reset canRoll flag

		this.knightMaxVelocity = 200; // Max speed
		this.knightAcceleration = 1000; // Speed it takes to get to the max speed

		this.edgeBlocks = [];

		this.add
			.image(400, 200, 'Level_1')
			.setDisplaySize(800, 400)
			.setDepth(-1);

		this.collisionBlocks = this.physics.add.group({
			allowGravity: false,
			immovable: true,
		});

		this.physics.add.collider(this.knight, this.collisionBlocks);

		this.placeCollisionBlocks(5, 1, { x: 0, y: 230 });
		this.placeCollisionBlocks(1, 5, { x: 135, y: 230 });
		this.placeCollisionBlocks(11, 1, { x: 150, y: 370 });
		this.placeCollisionBlocks(1, 4, { x: 585, y: 300 });
		this.placeCollisionBlocks(8, 1, { x: 585, y: 300 });
		this.placeCollisionBlocks(1, 8, { x: 275, y: 0 });
		this.placeCollisionBlocks(1, 8, { x: 395, y: 0 });
		this.placeCollisionBlocks(2, 1, { x: 210, y: 90 });
		this.placeCollisionBlocks(2, 1, { x: 425, y: 135 });
		this.placeCollisionBlocks(2, 1, { x: 600, y: 65 });
		this.placeCollisionBlocks(4, 1, { x: 275, y: 220 });

		this.coins = this.physics.add.group({
			allowGravity: false,
			immovable: true,
		});
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
	}

	initializeKnight() {
		this.knight = this.physics.add.sprite(100, 100, 'Idle');
		this.knight.setBounce(0.2);
		this.knight.setCollideWorldBounds(true);
		this.knight.body.setSize(30, 45, true);
		this.knight.body.setOffset(50, 20);
		this.knight.play('knightIdle', true);
	}

	initializeControls() {
		this.moveKeys = this.input.keyboard.addKeys({
			A: Phaser.Input.Keyboard.KeyCodes.A,
			D: Phaser.Input.Keyboard.KeyCodes.D,
			W: Phaser.Input.Keyboard.KeyCodes.W,
			S: Phaser.Input.Keyboard.KeyCodes.S,
			SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
		});

		this.moveKeys.SHIFT.on('down', () => {
			this.initiateRoll();
		});
	}

	handleMovement(direction) {
		const directionMultiplier = direction === 'left' ? -1 : 1;
		// If the player tries to move in the opposite direction of the current velocity, change direction immediately
		if (
			(direction === 'left' && this.knight.body.velocity.x > 0) ||
			(direction === 'right' && this.knight.body.velocity.x < 0)
		) {
			this.knight.setVelocityX(
				directionMultiplier * this.knightMaxVelocity
			);
		} else {
			if (
				Math.abs(this.knight.body.velocity.x) < this.knightMaxVelocity
			) {
				this.knight.setVelocityX(
					this.knight.body.velocity.x +
						directionMultiplier * this.knightAcceleration * (1 / 60)
				); // Assuming 60 FPS
			}
		}

		// Flip the sprite based on the direction
		this.knight.flipX = direction === 'left';

		if (this.knight.body.blocked.down) {
			this.knight.play('KnightRun', true);
		}
	}

	initiateRoll() {
		if (!this.canRoll || !this.knight.body.blocked.down) {
			return;
		}

		const directionMultiplier = this.knight.flipX ? -1 : 1;
		this.knight.setVelocityX(
			directionMultiplier * this.knightMaxVelocity * 1.5
		);
		this.knight.play('KnightRoll', true);
		this.canRoll = false;

		this.knight.setData('rolling', true); // Set the rolling state

		// Reset rolling state when the animation is complete
		this.knight.once('animationcomplete', (anim) => {
			if (anim.key === 'KnightRoll') {
				this.knight.setData('rolling', false);
			}
		});

		// Add a delay to reset the canRoll flag
		if (this.rollCooldown) {
			this.rollCooldown.remove(false);
		}

		this.rollCooldown = this.time.delayedCall(500, () => {
			this.canRoll = true;
		});
	}

	placeCollisionBlocks(repeatX, repeatY, location, size) {
		const blockSize = size || { width: 32, height: 32 };

		for (let i = 0; i < repeatX; i++) {
			for (let j = 0; j < repeatY; j++) {
				let blockX = location.x + i * blockSize.width;
				let blockY = location.y + j * blockSize.height;

				let block = this.collisionBlocks.create(blockX, blockY, null);
				block.setVisible(false);
				block.body.setAllowGravity(false);
				block.body.immovable = true;

				// Tracking edges
				if (repeatX === 1) {
					if (j === 0) this.edgeBlocks.push(block); // top edge for vertical walls
					if (j === repeatY - 1) this.edgeBlocks.push(block); // bottom edge for vertical walls
				} else if (repeatY === 1) {
					if (i === 0) this.edgeBlocks.push(block); // left edge for horizontal platforms
					if (i === repeatX - 1) this.edgeBlocks.push(block); // right edge for horizontal platforms
				}
			}
		}
	}

	hangingOnEdge() {
		// If the knight is currently hanging, handle exit conditions first

		let canGrab = false;
		const currentTime = this.time.now;

		if (this.knightIsHanging) {
			const sideOfBlock =
				this.knight.x > this.hangingBlock.x ? 'right' : 'left';

			// Drop or move based on movement keys
			if (
				(this.moveKeys.A.isDown && sideOfBlock === 'left') ||
				(this.moveKeys.D.isDown && sideOfBlock === 'right')
			) {
				this.knight.setVelocityX(sideOfBlock === 'right' ? -150 : 150);
				this.knight.setVelocityY(50);
				this.knight.play('knightJump', true);
				this.controlsEnabled = true;
				this.knightIsHanging = false;
				this.knight.body.allowGravity = true;
				return true;
			}

			// Jump while hanging
			if (this.moveKeys.W.isDown && !this.knight.body.blocked.down) {
				this.knight.setVelocityY(-350);
				this.knight.setVelocityX(sideOfBlock === 'right' ? -150 : 150);
				this.knight.play('knightJump', true);
				this.controlsEnabled = true;
				this.knightIsHanging = false;
				this.knight.body.allowGravity = true;
				return true;
			}
		}

		this.debugGraphics.clear();

		// Check if knight should start hanging
		for (let block of this.edgeBlocks) {
			// Visual representation of the edge block
			let edgeBlockBounds = block.getBounds();
			edgeBlockBounds.y -= 5; // Shift the block upwards by 5 pixels
			edgeBlockBounds.height = 5; // Set the height to 5 pixels

			// !Draw the edge block bounds
			//this.debugGraphics.fillRectShape(edgeBlockBounds);

			// area for collision detection
			let knightHandBounds = new Phaser.Geom.Rectangle(
				this.knight.x - 19,
				this.knight.y - 15,
				40,
				5
			);

			// !Draw the knight's hand bounds
			//this.debugGraphics.fillRectShape(knightHandBounds);

			if (
				Phaser.Geom.Rectangle.Overlaps(
					knightHandBounds,
					edgeBlockBounds
				) &&
				this.knight.body.velocity.y >= 0 &&
				!this.knight.body.blocked.down
			) {
				this.knight.setVelocity(0); // Stop the knight
				this.knight.play('Hanging', true);
				this.knightIsHanging = true;
				this.hangingBlock = block; // Store the block the knight is hanging on
				this.controlsEnabled = false; // Disable controls
				this.knight.body.allowGravity = false; // Disable gravity
				return true;
			}
		}

		return false;
	}

	update() {
		// Check if the knight is rolling
		if (this.knight.getData('rolling')) {
			return;
		}

		// Check if the knight is hanging
		if (this.hangingOnEdge()) {
			return;
		}

		if (this.moveKeys.A.isDown) {
			this.handleMovement('left');
		} else if (this.moveKeys.D.isDown) {
			this.handleMovement('right');
		} else {
			// Instant stop when no movement key is pressed
			if (this.knight.body.blocked.down) {
				this.knight.setVelocityX(0);
				this.knight.play('knightIdle', true);
			}

			if (this.knight.body.blocked.down) {
				this.knight.play('knightIdle', true);
			}
		}

		if (this.moveKeys.W.isDown && this.knight.body.blocked.down) {
			let jumpVelocity = -390;
			if (this.knight.getData('rolling')) {
				jumpVelocity *= 1.5;
			}
			this.knight.setVelocityY(jumpVelocity);
			this.knight.play('knightJump', true);
			console.log(jumpVelocity);
		}
	}
}

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
			debug: false,
		},
	},
};

const game = new Phaser.Game(config);
