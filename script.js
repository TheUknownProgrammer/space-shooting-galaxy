/** @type {HTMLCanvasElement}*/

        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        const device = navigator.userAgent;

        const gameWidth = 800;
        const gameHeight = 550;

        canvas.width = gameWidth;
        canvas.height = gameHeight;

        const playerWidth = 60; 
        const playerHeight = 60;

        const enemyWidth = 70;
        const enemyHeight = 70;

        var frames = 0;

        const mouse = {x: undefined, y: undefined};

        var canvasRect = canvas.getBoundingClientRect();

        function GameProps() {
            var win = false;
            var lose = false;
            
    
            var score = 0;
            var timer = 0;
            var timerInterval;

            const increaseScore = (points) => score += points;
            const setScore = (newScore) => score = newScore;
            const setWin = bool => win = bool;
            const setLose = bool => lose = bool;

            const getWin = () => win;
            const getLose = () => lose;
            const getScore = () => score;
            const getTimer = () => timer;

            const startTimer = () => {
                timerInterval = setInterval(() => {
                    timer += 0.1;
                    timer = parseFloat(timer.toFixed(1));
                }, 100);
            }

            const endTimer = () => {
                clearInterval(timerInterval);
            }

            const clearTimer = () => timer = 0;

            return {increaseScore,setWin,setLose,getWin,getLose,getScore,getTimer,startTimer,endTimer,clearTimer, setScore};
        }

        const player = new Player();
        const enemyWave = new EnemyWave();

        function checkLaserWithLaser() {
            for(let i = 0; i < enemyWave.projectiles.length; i++) {
                var enemyLaser = enemyWave.projectiles[i];
                for(let j = 0; j < player.projectiles.length; j++) {
                    var playerLaser = player.projectiles[j];
                    if(collisionDetection(playerLaser,enemyLaser)) {
                        playerLaser.markedForDeletion = true;
                        enemyLaser.markedForDeletion = true;
                    }
                }
            }
        }

        function ScrewProps() {
            var screws = [];

            const connectScrews = () => {
                const maxDistance = 80;
                for(let i = 0; i < screws.length; i++) {
                    for(let j = 0; j < screws.length; j++) {
                        if(distance(screws[i],screws[j]) <= maxDistance) {
                        ctx.beginPath();
                        ctx.moveTo(screws[i].x,screws[i].y);
                        ctx.lineTo(screws[j].x,screws[j].y);
                        ctx.save();
                        ctx.globalAlpha = 0.05;
                        ctx.strokeStyle = "white";
                        ctx.stroke();
                        ctx.restore();
                        }
                    }
                }
            }

            const makeScrews = otherObj => {
                var amount = Math.floor(Math.random() * 8) + 7;
    
                for(let i = 0; i < amount; i++) {
                    var size = Math.floor(Math.random() * 10) + 24;
                    var x = otherObj.x + otherObj.width/2-size/2;
                    var y = otherObj.y + otherObj.height/2-size/2;
                    screws.push(new Screw(size,x,y));
                }
            }

            const setScrews = (s) => screws = s;
            const getScrews = () => screws;
            const clearScrews = () => screws = [];
            const clearDeletedScrews = () => screws = screws.filter(obj => !obj.markedForDeletion);
            
            return {makeScrews, connectScrews, clearScrews, getScrews, setScrews,clearDeletedScrews};
        }

        function StarsProps() {
            var stars = [];

            const insertStar = () => stars.push(new Star());
            const clearStars = () => stars = [];
            const clearOutOfBound = () => stars = stars.filter(obj => !obj.outOfBound);
            const getStarsArr = () => stars;
            
            return {insertStar,clearStars,clearOutOfBound,getStarsArr};
        }

        const game = GameProps();
        const screws = ScrewProps();
        const stars = StarsProps();

        var lastTime = 0;
        var timeSinceStarted = 0;
        var deltaTime = 0;

        

        const winSound = new Audio("resources/audios/sfxs/win_sound.mp3");
        const loseSound = new Audio("resources/audios/sfxs/lose_sound.mp3");
        const gameMusic = new Audio("resources/audios/musics/space-atmospheric.mp3");
        gameMusic.loop = true;
        const startSound = new Audio("resources/audios/sfxs/enemy-detected.mp3");

        function getMousePos(e) {
            mouse.x = e.clientX - canvasRect.left;
            mouse.y = e.clientY - canvasRect.top;
        }
        
        function getTouchPos(e) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }

        function leaveCanvas() {
            mouse.x = undefined;
            mouse.y = undefined;
        }

        window.addEventListener("load", function() {
            window.addEventListener("resize", function() {
            canvasRect = canvas.getBoundingClientRect();
            });

            canvas.title = "Click To Start A New Game."
            canvas.addEventListener("click",startGame);

            displayStartScene();
            setFavicon();
            requestAnimationFrame(deltaCalc);
        });

        function deltaCalc(timestamp) {
            deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            timeSinceStarted += deltaTime;
            requestAnimationFrame(deltaCalc);
        }
        
        function render() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            frames++;

            if(screws.getScrews().length > 0) {
                screws.connectScrews();
            }
            if(frames % 50 == 0) {
                stars.insertStar();
            }

            screws.clearDeletedScrews();
            stars.clearOutOfBound();

            checkLaserWithLaser();
            enemyWave.render();
            player.render();

            [...stars.getStarsArr(),...screws.getScrews()].forEach(obj => obj.draw());
            [...stars.getStarsArr(),...screws.getScrews()].forEach(obj => obj.update());
            displayScore();
            displayTimer();
            checkWin();
            if(!game.getLose() && !game.getWin()) requestAnimationFrame(render);
            else {
                blackBackground();
                if(game.getLose()) {
                    displayGameOver();
                } else {
                    displayWinScreen();
                }
                gameStop();
            }
        }

        function gameStop() {
            removeMouseEvents();
            attachClickToRestart();
            game.endTimer();
            gameMusic.pause();
        }

        function checkWin() {
            if(enemyWave.enemies.length == 0) {
                game.setWin(true);
            }
        }
        
        function displayScore() {
            ctx.save();
            ctx.font = "17.5px monospace";
            ctx.fillStyle = "white";
            ctx.textBaseline = "top";
            ctx.fillText("score: " + game.getScore(),5,5);
            ctx.restore();
        }

        function displayWinScreen() {
            winSound.currentTime = 0;
            winSound.play();
            ctx.save();
            ctx.font = "80px arial";
            ctx.fillStyle = "lightgreen";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText("YOU WON!",canvas.width/2,canvas.height/2);
            ctx.restore();
        }

        function displayGameOver() {
            
            loseSound.currentTime = 0;
            loseSound.play();
            ctx.save();
            ctx.font = "80px arial";
            ctx.fillStyle = "red";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText("YOU LOSE!",canvas.width/2,canvas.height/2);
            ctx.restore();
            
        }

        function displayTimer() {
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = "20px monospace";
            ctx.textBaseline = "top";
            ctx.fillText("timer: " + game.getTimer(),5,20);
            ctx.restore();
        }

        function getDigits(num) {
            return num.toString().length;
        }

        function numBetween(num) {
            console.log(`between ${Math.floor(num)} to ${Math.ceil(num)}`);
        }

        function attachClickToRestart() {
            canvas.title = "click to restart the game.";
            canvas.addEventListener("click", restart);
        }

        function attachMouseEvents() {
            canvas.addEventListener("mousemove",getMousePos);
            canvas.addEventListener("mouseleave", leaveCanvas);
            player.enableShooting();
            canvas.addEventListener("touchmove", getTouchPos);
            canvas.addEventListener("touchend", leaveCanvas);
        }

        function removeMouseEvents() {
            canvas.removeEventListener("mousemove",getMousePos);
            canvas.removeEventListener("mouseleave", leaveCanvas);
            player.disableShooting();
            canvas.removeEventListener("touchmove", getTouchPos);
            canvas.removeEventListener("touchend", leaveCanvas);
        }

        function restart() {
            if(!loseSound.paused) {
                loseSound.pause();
            }
            else if(!winSound.paused) {
                winSound.pause();
            }
            gameMusic.currentTime = 0;
            gameMusic.play();
            startSound.play();
            canvas.removeEventListener("click", restart);
            canvas.removeAttribute("title");
            enemyWave.clearEnemies();
            enemyWave.clearEnemyProjectiles();
            screws.clearScrews();
            game.setScore(0);
            game.setLose(false);
            game.setWin(false);
            player.clearProjectiles();
            player.allowToShoot = true;
            player.setPosCenter();
            player.resetHealth();
            stars.clearStars();

            frames = 0;

            game.clearTimer();
            game.startTimer();
            
            enemyWave.clearEnemies();
            enemyWave.createEnemies();
            attachMouseEvents();
            requestAnimationFrame(render);
        }

        function setFavicon() {
            var fav = document.createElement("link");
            fav.setAttribute("rel","icon");
            fav.href = "resources/spaceship player.png"; 
            document.head.append(fav);
        }

        function blackBackground() {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "black";
            ctx.fillRect(0,0,gameWidth,gameHeight);
            ctx.restore();
        }

        function startGame() {
        gameMusic.play();
        startSound.play();
        
        game.startTimer();
        canvas.removeEventListener("click",startGame);
        canvas.removeAttribute("title");
        attachMouseEvents();
        requestAnimationFrame(render);
        }

        function displayStartScene() {
            ctx.save();
            ctx.fillStyle = rndColor();
            ctx.font = "50px cursive";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText("Click To Start New Game.",canvas.width/2+Math.floor(Math.random() * 11)-5,canvas.height/2+Math.floor(Math.random() * 11)-5);
            ctx.restore();
        }

        function distance(point1,point2) {
            return Math.sqrt(Math.pow(point2.x-point1.x,2)+Math.pow(point2.y-point1.y,2));
        }

        function rndColor() {
            return `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
        }

        function collisionDetection(rect1,rect2) {
            return rect1.x + rect1.width >= rect2.x && rect1.x <= rect2.x + rect2.width && rect1.y + rect1.height >= rect2.y && rect1.y <= rect2.y + rect2.height;
        }