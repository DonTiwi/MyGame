import Phaser, { Time } from 'phaser';
import Knight from './Knight';
import { LevelWoods } from './levelWoods';

class MyGame extends Phaser.Scene {
	constructor() {
		super();
		this.screenWidth = 800;
		this.screenHeight = 400;
		this.blockSize = 24;
		this.DISPLAY_SIZE_OFFSET = 5;
		this.FLAT_AREA_THRESHOLD = 5;
		this.HILL_OFFSET_RANGE = this.blockSize / 2;
		this.BLOCK_TYPE = 15;
	}

	debug() {
		this.debugGraphics = this.add.graphics({
			fillStyle: {
				color: this.controlsEnabled ? 0xff0000 : 0xff0000,
			},
		});
	}

	preload() {
		const knightContext = require.context(
			'./assets/Knight_1',
			false,
			/\.(png|json)$/
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

		this.load.spritesheet('Attacks', knightContext('./Attacks.png'), {
			frameWidth: 128,
			frameHeight: 64,
		});

		const blockContext = require.context(
			'./assets/oak_woods',
			false,
			/\.(png)$/
		);

		this.load.spritesheet(
			'blocks',
			blockContext('./oak_woods_tileset_Custom.png'),
			{
				frameWidth: this.blockSize,
				frameHeight: this.blockSize,
			}
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

		const decorationContext = require.context(
			'./assets/oak_woods/decorations',
			false,
			/\.(png)$/
		);

		this.load.image('rock_1', decorationContext('./rock_1.png'));
		this.load.image('rock_2', decorationContext('./rock_2.png'));
		this.load.image('rock_3', decorationContext('./rock_3.png'));

		this.load.image('lamp', decorationContext('./lamp.png'));

		this.load.image('sign', decorationContext('./sign.png'));

		this.load.image('fence_1', decorationContext('./fence_1.png'));
		this.load.image('fence_2', decorationContext('./fence_2.png'));
	}

	create() {
		this.physics.world.setBounds(0, 0, 2000, this.screenHeight); // Adjust as needed

		this.collisionBlocks = []; // Initialize an empty array for collision blocks
		this.createTerrain();

		this.createAnimations();
		this.knight = new Knight(this, this.edgeBlocks); // Pass edgeBlocks array here
		this.physics.add.collider(this.knight.knight, this.collisionBlocks);

		this.initiateCamera();
		this.createParallaxBackground();
	}

	initiateCamera() {
		this.cameras.main.startFollow(this.knight.knight);
		this.cameras.main.setBounds(0, 0, 2000, 2000);
		this.cameras.main.roundPixels = true;
		this.cameras.main.setFollowOffset(0, 200);
		this.cameras.main.setLerp(0.1, 0.1);
	}
	update() {
		this.knight.update();

		// Update the tile positions of the background images based on the camera's scrollX value
		this.background1.tilePositionX = this.cameras.main.scrollX * 0.1;
		this.background2.tilePositionX = this.cameras.main.scrollX * 0.2;
		this.background3.tilePositionX = this.cameras.main.scrollX * 0.3;

		// make the image move with the camera
		this.background1.setScrollFactor(0);
		this.background2.setScrollFactor(0);
		this.background3.setScrollFactor(0);
	}

	createParallaxBackground() {
		// Add the background images
		this.background1 = this.add
			.tileSprite(
				0,
				0,
				this.cameras.main.width,
				this.cameras.main.height,
				'background1'
			)
			.setOrigin(0, 0)
			.setScale(2); // Adjust the scale as needed

		this.background2 = this.add
			.tileSprite(
				0,
				0,
				this.cameras.main.width,
				this.cameras.main.height,
				'background2'
			)
			.setOrigin(0, 0)
			.setScale(2); // Adjust the scale as needed

		this.background3 = this.add
			.tileSprite(
				0,
				0,
				this.cameras.main.width,
				this.cameras.main.height,
				'background3'
			)
			.setOrigin(0, 0)
			.setScale(2); // Adjust the scale as needed

		// Set the depth position of the background images
		this.background1.setDepth(-100);
		this.background2.setDepth(-99);
		this.background3.setDepth(-98);
	}

	createTerrain() {
		const baseGroundLevel = this.screenHeight - 20;
		const terrainWidth = 100;
		const maxSlopeHeight = this.blockSize * 0.2; // Gentler slopes
		const hillLengthMin = 5; // Minimum length of a hill
		const hillLengthMax = 15; // Maximum length of a hill
		const flatLengthMin = 3; // Minimum length of a flat area
		const flatLengthMax = 8; // Maximum length of a flat area
		let currentY = baseGroundLevel;
		let hillCounter = 0; // Counts the length of the current hill
		let flatCounter = 0; // Counts the length of the current flat area

		let hillPeak = false; // Flag to indicate the hill's peak has been reached
		let innerFlatCounter = 0; // Counts the length of a flat area within a hill

		// Create the terrain
		const deltaY = 3;
		const groundLevel = this.screenHeight - 20;

		// Initialize the terrainHeights array if not already done
		this.terrainHeights = [];

		for (let i = 0; i < terrainWidth; i++) {
			// Determine if we should start a hill
			if (hillCounter === 0 && Phaser.Math.Between(0, 10) < 2) {
				// 20% chance
				hillCounter = Phaser.Math.Between(hillLengthMin, hillLengthMax);
			}

			// Set the terrain height for the current x position
			this.terrainHeights[i] = currentY;

			// Determine if we should start a flat area
			if (
				flatCounter === 0 &&
				hillCounter === 0 &&
				Phaser.Math.Between(0, 10) < 10
			) {
				// 30% chance
				flatCounter = Phaser.Math.Between(flatLengthMin, flatLengthMax);
			}

			// Build the hill by decreasing Y
			if (hillCounter > 0) {
				currentY -= maxSlopeHeight;
				hillCounter--;
				if (
					hillCounter === 0 ||
					currentY < baseGroundLevel - maxSlopeHeight * hillLengthMax
				) {
					// Once we hit the max height or the hill length, start descending
					hillCounter = -Phaser.Math.Between(
						hillLengthMin,
						hillLengthMax
					);
				}
			} else if (hillCounter < 0) {
				// Descend the hill by increasing Y
				currentY += maxSlopeHeight;
				hillCounter++;
				if (currentY > baseGroundLevel) {
					currentY = baseGroundLevel;
					hillCounter = 0; // Stop descending once we reach base level
				}
			}

			// Keep the terrain flat for a stretch
			if (flatCounter > 0) {
				flatCounter--;
			}

			// Ensure the terrain doesn't go below the base level
			if (currentY > baseGroundLevel) {
				currentY = baseGroundLevel;
			}

			// Inner flat areas on hills
			if (hillCounter > 0 && Phaser.Math.Between(0, 10) < 2) {
				// 20% chance within hill elevation
				innerFlatCounter = Phaser.Math.Between(2, 4); // Short flat areas
			}
			if (innerFlatCounter > 0) {
				innerFlatCounter--;
				continue; // Skip elevation changes for a bit of flatness
			}

			// Create and place ground block
			const block = this.physics.add.staticImage(
				i * this.blockSize,
				currentY,
				'blocks',
				1 // Assuming '1' is the correct frame for ground blocks
			);
			this.addCollisionBlock(block);

			// Fill the empty space under the ground block with other blocks
			for (
				let j = currentY + this.blockSize;
				j < this.screenHeight + 10;
				j += this.blockSize
			) {
				const block = this.createBlock(
					i * this.blockSize,
					j,
					'blocks',
					this.BLOCK_TYPE,
					this.blockSize + this.DISPLAY_SIZE_OFFSET
				);
				this.addCollisionBlock(block);
			}

			this.addDecoration(i * this.blockSize, currentY, deltaY);
		}

		// Create platforms
		const platformWidth = Phaser.Math.Between(3, 5);
		const platformCount = 10;
		const platforms = []; // Array to store the created platforms

		for (let i = 0; i < platformCount; i++) {
			let x = Phaser.Math.Between(0, terrainWidth - platformWidth);
			let y = Phaser.Math.Between(groundLevel - 150, groundLevel - 50);

			// Ensure platform doesn't spawn inside terrain
			while (this.isInsideTerrain(x, y, platformWidth)) {
				x = Phaser.Math.Between(0, terrainWidth - platformWidth);
				y = Phaser.Math.Between(groundLevel - 150, groundLevel - 50); // Adjust as necessary
			}

			// Ensure platforms are not too close to each other
			let isOverlapping;
			do {
				isOverlapping = platforms.some((platform) => {
					return (
						Phaser.Math.Distance.Between(
							x * this.blockSize,
							y,
							platform.x,
							platform.y
						) <
						this.blockSize * 5
					);
				});
				if (isOverlapping) {
					x = Phaser.Math.Between(0, terrainWidth - platformWidth);
					y = Phaser.Math.Between(
						groundLevel - 100,
						groundLevel - 50
					);
				}
			} while (isOverlapping);

			// Add platform edge and middle blocks
			for (let j = 0; j < platformWidth; j++) {
				let frame = 1; // Middle block
				if (j === 0) frame = 0; // Left edge block
				if (j === platformWidth - 1) frame = 3; // Right edge block

				const block = this.createBlock(
					(x + j) * this.blockSize,
					y,
					'blocks',
					frame,
					this.blockSize
				);
				this.addCollisionBlock(block);
			}

			// Store the created platform
			platforms.push({
				x: x * this.blockSize,
				y: y,
				width: platformWidth * this.blockSize,
				height: this.blockSize,
			});
		}
	}

	isInsideTerrain(x, y, width) {
		// Check if the given rectangle is inside the terrain
		for (let i = x; i < x + width; i++) {
			if (y < this.terrainHeights[i]) {
				return true;
			}
		}

		return false;
	}

	addDecoration(x, y, slope) {
		const isFlat = Math.abs(slope) <= 3;
		const decorationChance = Phaser.Math.Between(0, 100);

		// For flat sections
		if (isFlat) {
			// Chance to place a rock
			if (decorationChance < 10) {
				this.createDecoration(
					x + Phaser.Math.Between(-10, 10),
					y - this.blockSize,
					'rock_1'
				);
			}
			// Chance to place a lamp
			else if (decorationChance < 15) {
				this.createDecoration(
					x,
					y - this.blockSize * 1.5, // Assuming the lamp is taller
					'lamp'
				);
			}
			// Chance to place a sign
			else if (decorationChance < 5) {
				this.createDecoration(x, y - this.blockSize, 'sign');
			}
			// Chance to place a fence
			else if (decorationChance < 30) {
				const fenceKey =
					Phaser.Math.Between(0, 1) === 0 ? 'fence_1' : 'fence_2';
				this.createDecoration(
					x,
					y - this.blockSize / 2, // Adjust for fence height if needed
					fenceKey
				);
			}
		}
		// For sloped sections
		else {
			// Chance to place a rock on a slope
			if (decorationChance < 10) {
				const rockKey =
					Phaser.Math.Between(0, 1) === 0 ? 'rock_2' : 'rock_3';
				this.createDecoration(
					x + Phaser.Math.Between(-10, 10),
					y - this.blockSize,
					rockKey
				);
			}
		}

		// Debug, list items that are being placed
		/* 		console.log(
			`x: ${x}, y: ${y}, slope: ${slope}, isFlat: ${isFlat}, decorationChance: ${decorationChance}`
		); */
	}

	createDecoration(x, y, key) {
		this.decorationConfig = {
			rock_1: { offset: 10, origin: { x: 0, y: 0 }, depth: -1 },
			rock_2: { offset: 15, origin: { x: 0, y: 0 }, depth: -1 },
			rock_3: { offset: 20, origin: { x: 0, y: 0 }, depth: -1 },
			lamp: { offset: 0, origin: { x: 0.5, y: 0.5 }, depth: -1 },
			sign: { offset: 0, origin: { x: 0.5, y: 0 }, depth: -1 },
			fence_1: { offset: 10, origin: { x: 0.5, y: 1 }, depth: -1 },
			fence_2: { offset: 10, origin: { x: 0.5, y: 1 }, depth: -1 },
		};

		if (!this.decorationConfig[key]) {
			console.warn(`Decoration config for key "${key}" not found!`);
			return null;
		}

		const config = this.decorationConfig[key];
		const decoration = this.add.sprite(x + config.offset, y, key);
		decoration.setOrigin(config.origin.x, config.origin.y);
		decoration.setDepth(config.depth);
		return decoration;
	}
	createBlock(x, y, key, frame, size) {
		const block = this.physics.add
			.staticImage(x, y, key, frame)
			.setDisplaySize(size, size);
		return block;
	}

	addCollisionBlock(block) {
		this.collisionBlocks.push(block);
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

		this.anims.create({
			key: 'knightAttack',
			frames: this.anims.generateFrameNumbers('Attacks', {
				start: 0,
				end: 20,
			}),
			frameRate: 15,
			repeat: 0,
		});
	}
}

export default MyGame;
