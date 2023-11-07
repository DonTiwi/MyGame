import Phaser from 'phaser';

export class LevelWoods extends Phaser.Scene {
	constructor() {
		super('levelWoods');
		this.screenHeight = 400; // replace with your actual value
		this.FLAT_AREA_THRESHOLD = 5; // replace with your actual value
		this.blockSize = 24; // replace with your actual value
		this.BLOCK_TYPE = 15; // replace with your actual value
		this.DISPLAY_SIZE_OFFSET = 5; // replace with your actual value
		this.collisionBlocks = []; // Initialize the collisionBlocks array
	}

	createBlock(x, y, key, frame, size) {
		const block = this.physics.add.sprite(x, y, key, frame);
		block.setDisplaySize(size, size);
		block.setOrigin(0, 0);
		block.setImmovable(true);
		block.body.allowGravity = false;
		return block;
	}

	createTerrain() {
		const groundLevel = this.screenHeight - 20;
		const terrainWidth = 100;

		// Create the ground blocks
		let currentY = groundLevel;
		const groundBlocks = [];
		for (let i = 0; i < terrainWidth; i++) {
			// Decide randomly whether to create a flat area or a hill
			if (Math.random() < 0.5) {
				// Create a flat area: keep the y-coordinate the same for a certain number of blocks
				if (i > 0 && i % this.FLAT_AREA_THRESHOLD === 0) {
					currentY =
						groundLevel +
						Math.floor(Math.random() * this.blockSize) -
						this.blockSize / 2;
				}
			} else {
				// Create a hill: add a random offset to the y-coordinate
				currentY +=
					Math.floor(Math.random() * this.blockSize) -
					this.blockSize / 2;
			}

			groundBlocks.push(currentY);

			const block = this.createBlock(
				i * this.blockSize,
				currentY,
				'blocks',
				1,
				this.blockSize + this.DISPLAY_SIZE_OFFSET
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
		}

		// Create platforms
		const platformWidth = Math.floor(Math.random() * 2) + 3;
		const platformCount = 10;
		const platforms = []; // Array to store the created platforms

		for (let i = 0; i < platformCount; i++) {
			let x, y;
			let isOverlapping = true;

			// Keep generating random coordinates until a non-overlapping position is found
			while (isOverlapping) {
				x = Math.floor(Math.random() * (terrainWidth - platformWidth));
				y = groundLevel - (50 + Math.random() * 150);

				// Check if the new platform overlaps with any existing platforms
				isOverlapping = platforms.some((platform) => {
					const minX = platform.x - platform.width;
					const maxX = platform.x + platform.width;
					const minY = platform.y - platform.height;
					const maxY = platform.y + platform.height;

					return x >= minX && x <= maxX && y >= minY && y <= maxY;
				});
			}

			// set edge blocks texture for the platform edges
			const leftEdge = this.createBlock(
				x * this.blockSize - 24,
				y,
				'blocks',
				0,
				this.blockSize
			);
			const rightEdge = this.createBlock(
				(x + platformWidth) * this.blockSize,
				y,
				'blocks',
				3,
				this.blockSize
			);

			// add collision blocks to the edge blocks
			this.addCollisionBlock(leftEdge);
			this.addCollisionBlock(rightEdge);

			for (let j = 0; j < platformWidth; j++) {
				const block = this.createBlock(
					(x + j) * this.blockSize,
					y,
					'blocks',
					1,
					this.blockSize
				);
				this.addCollisionBlock(block);
			}

			// Store the created platform in the platforms array
			platforms.push({
				x: x * this.blockSize,
				y: y,
				width: platformWidth * this.blockSize,
				height: this.blockSize,
			});
		}
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

	addCollisionBlock(block) {
		this.collisionBlocks.push(block);
	}

	create() {
		console.log('levelWoods created from levelWoods.js');

		this.createTerrain();
		this.createParallaxBackground();
	}
}
