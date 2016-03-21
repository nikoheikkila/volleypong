/**
 * 3D Pong in THREE.js
 * @author Niko Heikkilä <yo@nikoheikkila.com>
 * @version 1.0-rc1
 */

/**
 * TODO:
 * - Refactor players / paddles into their own classes
 * - Use background image
 * - Fix buggy AI logic
 */

/* THREE maps to THREE.js library global variable */
(function(window, document, THREE) {

    "use strict";

    /* Constants that define game data, feel free to modify */
    const cfg = {
        width: window.innerWidth,       // x-size of container
        height: window.innerHeight,     // y-size of container
        view_angle: 45,                 // angle, 45 degrees is good
        near: 0.1,
        far: 10000,
        field: {
            width: 1250,                // width of the playfield
            length: 2000                // length of the playfield
        },
        ball: {
            radius: 20                  // size of the ball
        },
        paddle: {
            width: 200,                 // width of the paddle
            height: 30                  // height of the paddle
        },
        score_limit: 10                 // how many points until the winner is declared
    };

    /* Aspect ratio as calculated from container size */
    var aspect = cfg.width / cfg.height;

    /* Declare other necessary variables */
    let container, renderer, camera, mainLight, canvas, sfx, scene, ball, player1, player2, field, running,
        player1Score, player2Score;

    /**
     * @class Field
     * @desc Object instance for drawing the playfield
     */
    class Field {

        constructor(fieldGeometry, fieldMaterial) {
            this.fieldGeometry = fieldGeometry;
            this.fieldMaterial = fieldMaterial;
            this.mesh          = this.init();
        }

        init() {
            let fieldGeometry = this.fieldGeometry,
                fieldMaterial = this.fieldMaterial,
                field         = new THREE.Mesh(fieldGeometry, fieldMaterial);
            field.position.set(0, -50, 0);
            scene.add(field);
        }
    }

    /**
     * @class Ball
     * @desc class and methods for implementing ball mechanics
     */
    class Ball {

        constructor(ballGeometry, ballMaterial) {
            this.ballGeometry = ballGeometry;
            this.ballMaterial = ballMaterial;
            this.mesh         = this.init();
            this.$velocity    = null;   // Ball velocity
            this.$stopped     = true;   // Is the ball stopped?
            scene.add(this.mesh);
        }

        init() {
            let ballGeometry = this.ballGeometry,
                ballMaterial = this.ballMaterial,
                mesh         = new THREE.Mesh(ballGeometry, ballMaterial);

            mesh.position.set(0, 0, 0);
            return mesh;
        }

        launchBall() {

            /* Ball is passed randomly to either player */
            let direction   = Math.random() > 0.5 ? -1 : 1;
            this.$velocity  = {
                x: 0,
                z: direction * 20
            };
            this.$stopped = false;
        }

        stopBall() {
            this.$stopped = true;
        }

        /**
         * @method processFrame
         * @desc This method holds the core rules of the game
         */
        processFrame() {

            /* If the ball is not moving, launch it */
            if (!this.$velocity)
                this.launchBall();

            /* Detect if the ball hits Player 1 */
            if (this.isPaddle1Collision() && this.isAlignedWithPaddle(player1))
                this.hitBallBack(player1);

            /* Detect if the ball hits Player 2 */
            if (this.isPaddle2Collision() && this.isAlignedWithPaddle(player2))
                this.hitBallBack(player2);

            /* Side collision should slow the ball down a bit */
            if (this.isSideCollision())
                this.$velocity.x *= -0.3;

            /* Detect if the ball passes Player 1 */
            if (this.isPastPaddle1()) {
                updateScore("player2");
            }

            /* Detect if the ball passes Player 2 */
            if (this.isPastPaddle2()) {
                updateScore("player1");
            }

            if (this.$stopped)
                return;

            this.updateBallPosition();
        }

        updateBallPosition() {
            let ballPosition = this.mesh.position;

            ballPosition.x += this.$velocity.x;
            ballPosition.z += this.$velocity.z;

            /* Little twist to ball movement */
            ballPosition.y  = -((ballPosition.z - 1) * (ballPosition.z - 1) / 2000) + 435;
        }

        hitBallBack(paddle) {
            /* Play a nice sound effect when paddle hits the ball */
            sfx.play();

            /* Ball should continue to the opposite direction, invert the velocity */
            ball.$velocity.x  = (ball.mesh.position.x - paddle.position.x) / 5;
            ball.$velocity.z *= -1;
        }

        isPaddle2Collision() {
            return ball.mesh.position.z - cfg.ball.radius <= player2.position.z;
        }

        isPaddle1Collision() {
            return ball.mesh.position.z + cfg.ball.radius >= player1.position.z;
        }

        isAlignedWithPaddle(player) {
            let ballPos   = ball.mesh.position,
                playerPos = player.position;

            return (ballPos.x <= playerPos.x && ballPos.x >= playerPos.x - cfg.paddle.width / 2) || (ballPos.x >= playerPos.x && ballPos.x <= playerPos.x + cfg.paddle.width / 2);
        }

        isSideCollision() {
            let ballX = ball.mesh.position.x,
                halfFieldWidth = cfg.field.width / 2;

            return (ballX + cfg.ball.radius > halfFieldWidth) || (ballX - cfg.ball.radius < -halfFieldWidth);
        }

        isPastPaddle1() {
            return ball.mesh.position.z > player1.position.z;
        }

        isPastPaddle2() {
            return ball.mesh.position.z < player2.position.z;
        }

        /* Reset ball status */
        resetBall() {
            this.mesh.position.set(0, 0, 0);
            this.$velocity = null;
        }
    }

    /**
     * @method addPaddle
     * @desc Add paddle to the game, it's just a stretched cube with random color
     */
    let addPaddle = function paddle() {

        let paddleGeometry = new THREE.CubeGeometry(cfg.paddle.width, cfg.paddle.height, 10, 1, 1, 1),
            paddleMaterial = new THREE.MeshLambertMaterial({
                color: getRandomColor()
            }),
            paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);

        scene.add(paddle);
        return paddle;
    };

    /**
     * @method processCPUPaddle
     * @desc AI logic to detect if ball should be followed - currently it is infested with bugs
     */
    let processCPUPaddle = function cpu() {

        var ballPosition = ball.mesh.position,
            cpuPosition  = player2.position;

        if (cpuPosition.x - 100 > ballPosition.x)
            cpuPosition.x -= Math.min(cpuPosition.x - ballPosition.x, 3);

        if (cpuPosition.x + 100 > ballPosition.x) {
            cpuPosition.x -= Math.min(cpuPosition.x - ballPosition.x, 3);
        }
    };

    /**
     * @method containerMouseMove
     * @desc Control the paddle with mouse (left/right)
     */
    let containerMouseMove = function mouseMove(e) {

        let mouseX = e.clientX;
        camera.position.x = player1.position.x = -((cfg.width - mouseX) / cfg.width * cfg.field.width) + (cfg.field.width / 2);
    };

    /**
     * @method stopGame
     * @desc Stop the game
     */
    let stopGame = function stop() {

        ball.stopBall();
        ball.resetBall();
    };

    /**
     * @method endGame
     * @desc End the game and declare the winner
     */
    let endGame = function end(winner) {
        alert("Congratulations to the winner " + winner + "!");
        resetScore();
        stopGame();
    };

    /**
     * @method updateScore
     * @desc update either player score
     * TODO: Implement proper data storage for player points (currently in HTML)
     */
    let updateScore = function score(player) {

        var currentScore;

        if (player === "player1") {
            currentScore = parseInt(document.querySelector('.player1-score').innerHTML) + 1;
            if (currentScore < cfg.score_limit) {
                document.querySelector('.player1-score').innerHTML = currentScore;
            } else {
                endGame("Player 1");
            }
        } else if (player === "player2") {
            currentScore = parseInt(document.querySelector('.player2-score').innerHTML) + 1;
            if (currentScore < cfg.score_limit) {
                document.querySelector('.player2-score').innerHTML = currentScore;
            } else {
                endGame("Player 2");
            }
        } else {
            return false;
        }

        stopGame();
        return true;
    };

    /**
     * @method resetScore
     * @desc This just sets the scores back to zero
     */
    let resetScore = function reset() {
        document.querySelector('.player1-score').innerHTML = 0;
        document.querySelector('.player2-score').innerHTML = 0;
    };

    /**
     * @method render
     * @desc This renders the game frame by frame
     */
    let render = function render() {

        requestAnimationFrame(render);

        ball.processFrame();
        processCPUPaddle();

        renderer.render(scene, camera);
    };

    /**
     * @method getRandomColor
     * @desc For additional visual freakiness
     */
    let getRandomColor = function color() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    };

    /* Set up the game assets here */
    let init = function init() {

        renderer = new THREE.WebGLRenderer({
            alpha: true
        });

        renderer.setSize(cfg.width, cfg.height);
        renderer.setClearColor(0x000000, 0);
        canvas = renderer.domElement;
        document.body.appendChild(canvas);

        camera = new THREE.PerspectiveCamera(cfg.view_angle, aspect, cfg.near, cfg.far);
        camera.position.set(0, 250, cfg.field.length / 2 + 600);

        scene = new THREE.Scene();
        scene.add(camera);

        field = new Field(
            new THREE.CubeGeometry(cfg.field.width, 5, cfg.field.length, 1, 1, 1),
            new THREE.MeshLambertMaterial({
                color: getRandomColor()
            })
        );

        ball = new Ball(
            new THREE.SphereGeometry(cfg.ball.radius, 16, 16),
            new THREE.MeshLambertMaterial({
                color: getRandomColor()
            })
        );

        player1 = addPaddle();
        player1.position.z = cfg.field.length / 2 - 40;

        player2 = addPaddle();
        player2.position.z = -cfg.field.length / 2 + 40;

        sfx = document.querySelector('.ball-hit');

        mainLight = new THREE.HemisphereLight(getRandomColor(), getRandomColor());
        scene.add(mainLight);

        renderer.domElement.addEventListener('mousemove', containerMouseMove);
    };

    /* PLAY! */
    init();
    render();

})(window, window.document, window.THREE);
