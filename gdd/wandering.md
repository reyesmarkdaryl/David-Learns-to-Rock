const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

      // Only wander if NOT in combat range and NOT attacking
      if (distToTarget > this.attackRange * 1.5 && !this.isAttacking) {

        this.idleTimer -= (this.scene.game.loop.delta);

        if (this.idleTimer <= 0 || !this.idleTarget) {
          this.idleTimer = Phaser.Math.Between(1500, 4000);

          const radius = 70;

          this.idleTarget = {
            x: this.x + Phaser.Math.Between(-radius, radius),
            y: this.y + Phaser.Math.Between(-radius, radius)
          };
        }

        if (this.idleTarget) {
          const idleDist = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.idleTarget.x,
            this.idleTarget.y
          );

          if (idleDist > 5) {
            const angle = Phaser.Math.Angle.Between(
              this.x,
              this.y,
              this.idleTarget.x,
              this.idleTarget.y
            );

            const vx = Math.cos(angle) * (this.speed * 0.4);
            const vy = Math.sin(angle) * (this.speed * 0.4);

            this.setVelocity(vx, vy);
          } else {
            this.setVelocity(0);
            this.idleTarget = null;
          }

          this.handleAnimation('run');
          this.updateHealthBar();
          return; // IMPORTANT: skip combat logic while wandering
        }
      }