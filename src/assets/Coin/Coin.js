class Coin extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'frame0000');
		scene.add.existing(this);

		// Create the coin animation if it doesn't exist

		if (!scene.anims.get('coin')) {
			scene.anims.create({
				key: 'coin',
				frames: scene.anims.generateFrameNames('coin', {
					prefix: 'frame',
					zeroPad: 4,
					start: 0,
					end: 5,
				}),

				frameRate: 10,
				repeat: -1,
			});
		}

		// Play the animation
		this.play('coin');
	}
}

export default Coin;
