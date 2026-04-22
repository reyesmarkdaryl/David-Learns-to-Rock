import * as Phaser from 'phaser';
export class SummonSystem {
    targetSequence = [];
    currentIndex = 0;
    DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    constructor() {
        this.randomizeSequence();
    }
    randomizeSequence() {
        this.targetSequence = [];
        for (let i = 0; i < 5; i++) {
            const randomDir = this.DIRECTIONS[Phaser.Math.Between(0, this.DIRECTIONS.length - 1)];
            this.targetSequence.push(randomDir);
        }
        this.currentIndex = 0;
    }
    checkInput(key) {
        const inputMap = {
            'UP': 'UP',
            'DOWN': 'DOWN',
            'LEFT': 'LEFT',
            'RIGHT': 'RIGHT'
        };
        const direction = inputMap[key];
        if (!direction)
            return false;
        if (direction === this.targetSequence[this.currentIndex]) {
            this.currentIndex++;
            if (this.currentIndex === 5) {
                this.randomizeSequence();
                return true; // Success!
            }
        }
        else {
            this.currentIndex = 0; // Reset progress on mistake
        }
        return false;
    }
    getProgress() {
        return this.currentIndex;
    }
}
