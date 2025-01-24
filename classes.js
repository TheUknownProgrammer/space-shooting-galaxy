class Player {
    #appearance = new Image();
    constructor() {
        this.#appearance.src = "resources/spaceship player.png";
        var offsetFromBottom = 50;
        this.width = playerWidth;
        this.height = playerHeight;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - offsetFromBottom;
        this.initalHealth = 600;
        this.health = this.initalHealth;
        this.GotHitSound = new Audio("resources/audios/sfxs/player got hit.mp3");
        this.rotation = 0;
        this.projectiles = [];
        this.allowToShoot = true;
        this.shootSound = new Audio("resources/audios/sfxs/shoot.mp3");
        this.shootingCooldown = 585;
    }
    draw() {
        if (this.health > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.drawImage(this.#appearance, 0, 0, this.width, this.height);
            ctx.font = "bold 20px arial";
            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(this.health, this.width / 2, this.height / 2);
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width / 2, 0);
            ctx.stroke();
            ctx.restore();
        }
    }
    update() {
        if (mouse.x != undefined) {
            var dx = (mouse.x - this.x - this.width / 2) / 5
            if (mouse.x != this.x + this.width / 2) {
                this.x += dx;
                if (this.x < 0) {
                    this.x = 0;
                }
                if (this.x + this.width > canvas.width) {
                    this.x = canvas.width - this.width;
                }
            }
            if (dx < 0) {
                this.rotation = -.15;
            } else if (dx > 0) {
                this.rotation = .15;
            } else {
                this.rotation = 0;
            }
        }
    }
    shootingFunction() {
        return e => this.shoot();
    }
    enableShooting() {
        canvas.addEventListener("click", this.shootingFunction());
    }
    disableShooting() {
        canvas.removeEventListener("click", this.shootingFunction());
    }
    shoot() {
        if (this.allowToShoot) {
            if (!this.shootSound.paused) {
                this.shootSound.currentTime = 0;
            } else {
                this.shootSound.play();
            }
            var pWidth = 12.5;
            var pHeight = 12.5;
            var thisObj = this;
            this.projectiles.push(new playerProjectile(this.x + this.width / 2 - pWidth / 2, this.y - pHeight, pWidth, pHeight));
            this.allowToShoot = false;
            setTimeout(() => {
                thisObj.allowToShoot = true;
            }, this.shootingCooldown);
        }
    }
    render() {
        [...this.projectiles].forEach(obj => obj.draw());
        [...this.projectiles].forEach(obj => obj.update(enemyWave));
        this.clearDeletedPlayerProjectiles();
        this.draw();
        this.update();
    }
    clearDeletedPlayerProjectiles = () => this.projectiles = this.projectiles.filter(obj => !obj.markedForDeletion);
    clearProjectiles = () => this.projectiles = [];
    resetHealth = () => this.health = this.initalHealth;
    setPosCenter = () => this.x = gameWidth / 2 - this.width / 2;
}

class Projectile {
    constructor(pWidth, pHeight, x, y, speed, damage) {
        this.height = pHeight;
        this.width = pWidth;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.markedForDeletion = false;

    }
}

class playerProjectile extends Projectile {
    constructor(x, y, w, h) {
        var speed = 2.75;
        var damage = Math.floor(Math.random() * 4) + 11;
        super(w, h, x, y, speed, damage);
        this.appearance = new Image();
        this.appearance.src = "resources/player_projectile.png";
    }
    draw() {
        ctx.drawImage(this.appearance, this.x, this.y, this.width, this.height);
    }
    update(wave) {
        this.y -= this.speed;

        if (this.y + this.height < 0) {
            this.markedForDeletion = true;
        }

        for (let i = 0; i < wave.enemies.length; i++) {
            if (collisionDetection(wave.enemies[i], this)) {
                wave.enemies[i].health -= this.damage;
                this.markedForDeletion = true;

                if (wave.enemies[i].health <= 0) {
                    wave.enemies[i].dead = true;
                    if (wave.enemies.length > 1) {
                        wave.enemies[i].destroyedSound.play();
                        screws.makeScrews(wave.enemies[i]);
                    }
                    game.increaseScore(1);
                } else {
                    wave.enemies[i].gotHitSound.play();
                }
            }
        }
    }
}

class enemyProjectile extends Projectile {
    constructor(otherEnemy, speed, damage, projectileVisual) {
        var pWidth = 15;
        var pHeight = Math.floor(Math.random() * 6) + 10;
        var x = otherEnemy.x + (otherEnemy.width / 2 - pWidth / 2)
        var y = otherEnemy.y + otherEnemy.height;
        super(pWidth, pHeight, x, y, speed, damage);
        this.projectileVisual = projectileVisual;
    }
    draw() {


        ctx.drawImage(this.projectileVisual, this.x, this.y, this.width, this.height);
    }
    update() {
        this.y += this.speed;

        if (this.y > canvas.height) {
            this.markedForDeletion = true;
        }
    }
}

class Enemy {

    constructor(x, y, projectileArray) {
        const destroyedSounds = [new Audio("resources/audios/sfxs/destroyed1.mp3"), new Audio("resources/audios/sfxs/destroyed2.mp3"), new Audio("resources/audios/sfxs/destroyed3.mp3")];
        const enemyTypes = [
            { image: "resources/enemies/enemy1.png", bulletVisual: "resources/enemies/projectiles/projectile1_enemy.png", bulletDamage: 7 },
            { image: "resources/enemies/enemy2.png", bulletVisual: "resources/enemies/projectiles/projectile2_enemy.png", bulletDamage: 9 },
            { image: "resources/enemies/enemy3.png", bulletVisual: "resources/enemies/projectiles/projectile3_enemy.png", bulletDamage: 10 },
            { image: "resources/enemies/enemy4.png", bulletVisual: "resources/enemies/projectiles/projectile4_enemy.png", bulletDamage: 11 },
            { image: "resources/enemies/enemy5.png", bulletVisual: "resources/enemies/projectiles/projectile5_enemy.png", bulletDamage: 8 }
        ];
        var enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.x = x;
        this.y = y;
        this.width = enemyWidth;
        this.height = enemyHeight;
        this.projectileVisual = new Image();
        this.projectileVisual.src = enemyType.bulletVisual;
        this.projectiles = projectileArray;
        this.health = Math.floor(Math.random() * 41) + 10;
        this.dead = false;
        this.sinceNotAttack = 0;
        this.attackTime = Math.floor(Math.random() * 3251) + 2650;
        this.look = new Image();
        this.look.src = enemyType.image;
        this.projectileDamage = enemyType.bulletDamage;
        this.destroyedSound = destroyedSounds[Math.floor(Math.random() * destroyedSounds.length)].cloneNode();
        this.gotHitSound = new Audio("resources/audios/sfxs/enemy_got_hit_by_laser.mp3");
    }
    draw() {
        ctx.drawImage(this.look, this.x, this.y, this.width, this.height);

        ctx.save();
        ctx.font = "13px arial";
        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(this.health, this.x + this.width / 2, this.y + this.height / 2);
        ctx.restore();
    }
    update() {
        this.sinceNotAttack += deltaTime;
    }
}

class EnemyWave {
    constructor() {
        this.enemies = [];
        this.projectiles = [];
        this.totalEnemies = 0;
        this.createEnemies();
    }
    createEnemies() {
        var rows = 4;
        var cols = 7;
        const gapX = gameWidth / enemyWidth + enemyWidth;
        const gapY = gameHeight / enemyHeight + enemyHeight;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < canvas.width; x += gapX) {
                this.enemies.push(new Enemy(x, y * gapY, this.projectiles));
                this.totalEnemies++;
            }
        }
    }
    clearDeadEnemies() {
        this.enemies = this.enemies.filter(obj => !obj.dead);
    }
    clearEnemies() {
        this.enemies = [];
    }
    render() {
        [...this.enemies, ...this.projectiles].forEach(obj => obj.draw());
        [...this.enemies, ...this.projectiles].forEach(obj => obj.update());
        this.enemyShoot();
        this.clearDeletedEnemyProjectiles();
        this.clearDeadEnemies();
        this.checkProjectileHitPlayer();
    }
    clearEnemyProjectiles() {
        this.projectiles = [];
    }
    clearDeletedEnemyProjectiles() {
        this.projectiles = this.projectiles.filter(function (obj) {
            return !obj.markedForDeletion;
        });
    }
    checkProjectileHitPlayer() {
        for (let i = 0; i < this.projectiles.length; i++) {
            if (collisionDetection(this.projectiles[i], player)) {
                player.health -= this.projectiles[i].damage;
                this.projectiles[i].markedForDeletion = true;
                player.GotHitSound.play();
                if (player.health <= 0) {
                    game.setLose(true);
                    player.health = 0;

                }
                return;
            }
        }
    }
    enemyShoot() {
        for (let i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            if (enemy.sinceNotAttack >= enemy.attackTime) {
                this.projectiles.push(new enemyProjectile(enemy, 2, enemy.projectileDamage, enemy.projectileVisual));
                enemy.sinceNotAttack = 0;
            }
        }
    }
}

class Screw {
    constructor(size, x, y) {
        var appearances = ["resources/screws/screw1.png", "resources/screws/screw2.png", "resources/screws/screw3.png"]
        this.x = x;
        this.y = y;
        this.size = size;
        this.velocityX = Math.random() * 4 - 2
        this.velocityY = Math.random() * 4 - 2;
        this.markedForDeletion = false;
        this.opacity = 1;
        this.decreaseOpacity = 0.01;
        this.angle = Math.random() * (Math.PI * 2);
        this.appearance = new Image();
        this.increaseAngle = Math.abs(Math.random() - 0.5);
        this.appearance.src = appearances[Math.floor(Math.random() * appearances.length)];
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.appearance, 0, 0, this.size, this.size);
        ctx.restore();
    }
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.opacity -= this.decreaseOpacity;
        this.angle += this.increaseAngle;

        if (this.opacity <= 0) {
            this.markedForDeletion = true;
        }
    }
}
class Star {
    constructor() {
        const starsList = ["resources/stars/star0.png", "resources/stars/star1.png", "resources/stars/star2.png", "resources/stars/star3.png", "resources/stars/star4.png", "resources/stars/star5.png"];
        this.size = Math.floor(Math.random() * 10) + 16;
        this.img = new Image();
        this.img.src = starsList[Math.floor(Math.random() * starsList.length)];
        this.velocityY = Math.random() * 1.5;
        this.x = Math.random() * (gameWidth - this.size);
        this.y = -this.size;
        this.outOfBound = false;
        this.opacity = Math.random();
        this.rotate = Math.random() * (Math.PI * 2);
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotate);
        ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
    update() {
        this.y += this.velocityY;

        if (this.y > canvas.height) {
            this.outOfBound = true;
        }
    }
}