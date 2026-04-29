import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Title
    const title = this.add.text(width / 2, height / 3, 'RHYTHM HORDE', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Menu Options
    const options = [
      { text: 'Start Game', scene: 'GymScene' },
      { text: 'Room Editor', scene: 'RoomEditorScene' },
    ];

    options.forEach((option, index) => {
      const button = this.add.text(width / 2, height / 2 + index * 80, option.text, {
        fontSize: '32px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

      button.on('pointerover', () => button.setStyle({ color: '#ffffff', backgroundColor: '#555555' }));
      button.on('pointerout', () => button.setStyle({ color: '#aaaaaa', backgroundColor: '#333333' }));
      button.on('pointerdown', () => {
        this.scene.start(option.scene);
      });
    });

    // Instructions
    this.add.text(width / 2, height - 50, 'Developed with Claude Code', {
      fontSize: '16px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }
}
