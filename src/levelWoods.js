import Phaser from 'phaser';

export class LevelWoods extends Phaser.Scene {
	constructor(scene, screenWidth, screenHeight, collisionGroup, edgeBlocks) {
		super('LevelWoods');
		this.scene = scene;

		this.screenWidth = screenWidth;
		this.screenHeight = screenHeight;
		this.collisionGroup = collisionGroup;
		this.edgeBlocks = edgeBlocks;

		this.placeCollisionBlocks = this.placeCollisionBlocks.bind(this);
		this.createBlocks = this.createBlocks.bind(this);
		this.preload = this.preload.bind(this);
	}

	preload() {
		const levelContext = require.context(
			'./assets/oak_woods/',
			false,
			/\.(png)$/
		);

		this.load.spritesheet(
			'blocks',
			levelContext('oak_woods_tileset_Custom.png'),
			{
				frameWidth: 24,
				frameHeight: 24,
			}
		);
	}

	// Method to place blocks in random areas in the level
	placeCollisionBlocks() {
		const minBlockCount = 10;
		const maxBlockCount = 20;

		const blockCount =
			Math.floor(Math.random() * (maxBlockCount - minBlockCount + 1)) +
			minBlockCount;

		const blockTexturesArray = [0, 1, 2, 3]; // where each number corresponds to a frame in your spritesheet

		for (let i = 0; i < blockCount; i++) {
			const randomX = Math.floor(Math.random() * this.screenWidth);
			const randomY = Math.floor(Math.random() * this.screenHeight);

			let blockTexture =
				blockTexturesArray[
					Math.floor(Math.random() * blockTexturesArray.length)
				]; // random texture from array

			this.createBlocks(
				1,
				1,
				{ x: randomX, y: randomY },
				undefined,
				undefined,
				blockTexture
			);
		}
	}

	createBlocks(repeatX, repeatY, location, size, blockType, blockTexture) {
		const blockSize = size || { width: 24, height: 24 };

		for (let i = 0; i < repeatX; i++) {
			for (let j = 0; j < repeatY; j++) {
				let blockX = location.x + i * blockSize.width;
				let blockY = location.y + j * blockSize.height;

				let block = this.collisionGroup.create(
					blockX,
					blockY,
					'blocks'
				);

				// Set the texture based on the Y location
				if (blockTexture === undefined) {
					throw new Error('Block texture is undefined');
				} else {
					if (blockY < 200) {
						block.setFrame(0);
					}
					if (blockY >= 200 && blockY < 400) {
						block.setFrame(1);
					}
					if (blockY >= 400) {
						block.setFrame(2);
					}
				}

				block.body.setAllowGravity(false);
				block.body.immovable = true;

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

	parallaxBackground() {
		// Add the background images
		this.background1 = this.scene.add.tileSprite(
			0,
			0,
			1280,
			720,
			'background1'
		);
		this.background2 = this.scene.add.tileSprite(
			0,
			0,
			1280,
			720,
			'background2'
		);
		this.background3 = this.scene.add.tileSprite(
			0,
			0,
			1280,
			720,
			'background3'
		);

		// Set the origin of the background images to the top left corner
		this.background1.setOrigin(0, 0);
		this.background2.setOrigin(0, 0);
		this.background3.setOrigin(0, 0);

		// Calculate the necessary scaling factor for the screen's width and height
		let scaleY = this.scene.cameras.main.height / 720;
		let scaleX = this.scene.cameras.main.width / 1280;

		// You can use whichever is the larger factor. Do note that this could distort your image.
		let scale = Math.max(scaleX, scaleY);

		// Apply the scaling factor to each image
		this.background1.setScale(scale);
		this.background2.setScale(scale);
		this.background3.setScale(scale);

		// Set the depth position of the background images
		this.background1.setDepth(-2);
		this.background2.setDepth(-1);
		this.background3.setDepth(0);

		// Set the tile position of the background images
		this.background1.tilePositionX = this.scene.cameras.main.scrollX * 0.1;
		this.background2.tilePositionX = this.scene.cameras.main.scrollX * 0.2;
		this.background3.tilePositionX = this.scene.cameras.main.scrollX * 0.3;
	}

	create() {
		// Call the method to create the parallax background
		this.parallaxBackground();
		// Set the tile position of the background images
		this.background1.tilePositionX = this.scene.cameras.main.scrollX * 0.1;
		this.background2.tilePositionX = this.scene.cameras.main.scrollX * 0.2;
		this.background3.tilePositionX = this.scene.cameras.main.scrollX * 0.3;
		// Call the method to place the blocks in the level
		this.placeCollisionBlocks();

		// The rest of your code from create() method goes here...
	}

	/* You can also modify the update() method if you want to apply any updates and checks to your blocks */
}
