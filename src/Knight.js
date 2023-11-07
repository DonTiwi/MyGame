import Phaser from 'phaser';

export default class Knight extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, edgeBlocks) {
		super(scene, 100, 100, 'Idle');
		this.scene = scene;

		this.lastDirection = 'Right';
		this.runState = 0;
		this.runTimer = 0;
		this.canJump = true;
		this.controlsEnabled = true;
		this.knightIsHanging = false;
		this.hangingBlock = null;
		this.grabCooldownDuration = 2000;
		this.lastGrabTime = 0;
		this.knightHealth = 100;
		this.isAttacking = false; // Add an isAttacking flag

		this.initializeKnight();
		this.initializeControls();

		this.canRoll = true; // flag to check if player can initiate a roll
		this.rollCooldown = null; // timer to reset canRoll flag

		this.knightMaxVelocity = 200; // Max speed
		this.knightAcceleration = 1000; // Speed it takes to get to the max speed

		this.edgeBlocks = edgeBlocks;
	}

	debugGraphics() {
		this.debugGraphics = this.scene.add.graphics({
			fillStyle: {
				color: this.controlsEnabled ? 0xff0000 : 0xff0000,
			},
		});
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

			// crouch while hanging
			if (this.moveKeys.S.isDown) {
				this.knight.play('CrouchIdle', true);
				this.controlsEnabled = true;
				this.knightIsHanging = false;
				this.knight.body.allowGravity = true;
				return true;
			}

			// ? Grab cooldown

			// Check if the knight can grab
			if (currentTime - this.lastGrabTime > this.grabCooldownDuration) {
				canGrab = true;
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
			this.debugGraphics.fillRectShape(edgeBlockBounds);

			// area for collision detection
			let knightHandBounds = new Phaser.Geom.Rectangle(
				this.knight.x - 19,
				this.knight.y - 15,
				40,
				5
			);

			// !Draw the knight's hand bounds
			this.debugGraphics.fillRectShape(knightHandBounds);

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

	initializeKnight() {
		this.knight = this.scene.physics.add.sprite(100, 100, 'Idle');
		this.knight.setBounce(0.2);
		this.knight.setCollideWorldBounds(true);
		this.knight.body.setSize(30, 45, true);
		this.knight.body.setOffset(50, 20);
		this.knight.play('knightIdle', true);

		this.knight.setDepth(10);
		this.createPlayerUI();
	}

	initializeControls() {
		this.moveKeys = this.scene.input.keyboard.addKeys({
			A: Phaser.Input.Keyboard.KeyCodes.A,
			D: Phaser.Input.Keyboard.KeyCodes.D,
			W: Phaser.Input.Keyboard.KeyCodes.W,
			S: Phaser.Input.Keyboard.KeyCodes.S,
			SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
			SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
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
			directionMultiplier * this.knightMaxVelocity * 1.5,
			// Halves the collition box height, allowing the knight to roll under smaller gaps
			this.knight.body.setSize(30, 22, true),
			this.knight.body.setOffset(50, 43),

			// * 1.5 // Increase the speed by 50% for 3 seconds then reset it
			setTimeout(() => {
				this.knight.setVelocityX(
					directionMultiplier * this.knightMaxVelocity,
					this.knight.body.setSize(30, 45, true),
					this.knight.body.setOffset(50, 20)
				);
			}, 1500)
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

		this.rollCooldown = this.scene.time.addEvent({
			delay: 500,
			callback: () => {
				this.canRoll = true;
			},
		});
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

	/**
	 * Updates the knight's movement and animations based on player input.
	 *
	 * @param {number} time - The current game time.
	 * @param {number} delta - The time elapsed since the last frame.
	 */
	update(time, delta) {
		// If knight is mid-roll, ignore input
		if (this.knight.getData('rolling')) {
			return;
		}

		this.handleInput();
	}

	handleInput() {
		// Check for attack first to prioritize it
		if (this.moveKeys.SPACE.isDown) {
			this.attack();
		} else if (!this.isAttacking) {
			// Only allow movement if not attacking
			if (this.moveKeys.A.isDown) {
				this.handleMovement('left');
			} else if (this.moveKeys.D.isDown) {
				this.handleMovement('right');
			}

			if (this.moveKeys.W.isDown) {
				this.jump();
			}
			if (this.moveKeys.S.isDown) {
				this.crouch();
			}
		}

		// If no keys are pressed, return to idle, but only if not attacking
		if (
			!this.moveKeys.A.isDown &&
			!this.moveKeys.D.isDown &&
			!this.moveKeys.W.isDown &&
			!this.moveKeys.S.isDown &&
			!this.moveKeys.SPACE.isDown &&
			!this.isAttacking
		) {
			this.idle();
		}
	}

	jump() {
		if (this.knight.body.blocked.down) {
			this.knight.setVelocityY(-390);
			this.knight.anims.play('knightJump', true);
		}
	}

	crouch() {
		if (this.knight.body.blocked.down) {
			this.knight.play('CrouchIdle', true);
		}
	}

	attack() {
		if (!this.isAttacking) {
			// Only play attack animation if not already attacking
			this.isAttacking = true; // Set the flag to true when attack starts
			this.knight.play('knightAttack', true);
			this.knight.once('animationcomplete', () => {
				// Reset the flag when attack animation completes
				this.isAttacking = false;
			});
		}
	}

	idle() {
		this.knight.setVelocityX(0);
		this.knight.anims.play('knightIdle', true);
	}

	// Create player UI
	createPlayerUI() {
		this.playerUI = this.scene.add.graphics();
		this.playerUI.setScrollFactor(0);
		this.playerUI.fillStyle(0x000000, 0.5);
		this.playerUI.fillRect(10, 10, 200, 20);
		this.playerUI.setDepth(100);

		this.playerHealthBar = this.scene.add.graphics();
		this.playerHealthBar.setScrollFactor(0);
		this.playerHealthBar.fillStyle(0xff0000, 1);
		this.playerHealthBar.fillRect(10, 10, 200, 20);
		this.playerHealthBar.setDepth(100);

		this.playerHealthText = this.scene.add.text(10, 10, '100', {
			fontSize: '16px',
			fill: '#fff',
		});
		this.playerHealthText.setScrollFactor(0);
		this.playerHealthText.setDepth(100);

		// Updating and logic for player UI
		this.scene.events.on('update', () => {
			this.playerHealthBar.clear();
			this.playerHealthBar.fillStyle(0xff0000, 1);
			this.playerHealthBar.fillRect(
				10,
				10,
				(this.knightHealth / 100) * 200,
				20
			);

			this.playerHealthText.setText(this.knightHealth);
		});
	}
}
