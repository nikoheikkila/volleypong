/**
 * Pong in THREE.js
 */

/**
 * Notes:
 * TODO
 */

(function(window, document, THREE) {

    const cfg = {
        width: window.innerWidth,
        height: window.innerHeight,
        view_angle: 45,
        near: 0.1,
        far: 10000,
        field: {
            width: 1000,
            length: 2000
        },
        ball: {
            radius: 20
        },
        paddle: {
            width: 200,
            height: 30
        }
    };

    var aspect = cfg.width / cfg.height;

    let container, renderer, camera, mainLight, scene, ball, player1, player2, field, running,
        player1Score, player2Score;

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

    class Ball {

        constructor(ballGeometry, ballMaterial) {
            this.ballGeometry = ballGeometry;
            this.ballMaterial = ballMaterial;
            this.mesh         = this.init();
            this.$velocity    = null;
            this.$stopped     = true;
            scene.add(this.mesh);
        }

        init() {
            let ballGeometry = this.ballGeometry,
                ballMaterial = this.ballMaterial,
                mesh         = new THREE.Mesh(ballGeometry, ballMaterial);
            mesh.position.set(0, 0, 0);
            camera.lookAt(mesh.position);

            return mesh;
        }

        launchBall() {
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

        processFrame() {
            if (!this.$velocity)
                this.launchBall();

            if (this.isPaddle1Collision() && this.isAlignedWithPaddle(player1))
                this.hitBallBack(player1);

            if (this.isPaddle2Collision() && this.isAlignedWithPaddle(player2))
                this.hitBallBack(player2);

            if (this.isSideCollision())
                this.$velocity.x *= -0.3;

            if (this.isPastPaddle1()) {
                updateScore("player2");
            }

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

            ballPosition.y  = -((ballPosition.z - 1) * (ballPosition.z - 1) / 2000) + 435;
        }

        hitBallBack(paddle) {
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

        resetBall() {
            this.mesh.position.set(0, 0, 0);
            this.$velocity = null;
        }
    }

    let addPaddle = function paddle() {

        let paddleGeometry = new THREE.CubeGeometry(cfg.paddle.width, cfg.paddle.height, 10, 1, 1, 1),
            paddleMaterial = new THREE.MeshLambertMaterial({
                color: 0xCCCCCC
            }),
            paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);

        scene.add(paddle);
        return paddle;
    };

    let processCPUPaddle = function cpu() {

        var ballPosition = ball.mesh.position,
            cpuPosition  = player2.position;

        if (cpuPosition.x - 100 > ballPosition.x)
            cpuPosition.x -= Math.min(cpuPosition.x - ballPosition.x, 3);

        if (cpuPosition.x + 100 > ballPosition.x) {
            cpuPosition.x -= Math.min(cpuPosition.x - ballPosition.x, 3);
        }
    };

    let containerMouseMove = function mouseMove(e) {

        let mouseX = e.clientX;
        camera.position.x = player1.position.x = -((cfg.width - mouseX) / cfg.width * cfg.field.width) + (cfg.field.width / 2);
    };

    let stopGame = function stop() {

        ball.stopBall();
        ball.resetBall();
    };

    let updateScore = function score(player) {

        var currentScore;

        if (player === "player1") {
            console.debug("Player 1 scores");
            currentScore = parseInt(document.querySelector('.player1-score').innerHTML) + 1;
            document.querySelector('.player1-score').innerHTML = currentScore;
        } else if (player === "player2") {
            console.debug("Player 2 scores");
            currentScore = parseInt(document.querySelector('.player2-score').innerHTML) + 1;
            document.querySelector('.player2-score').innerHTML = currentScore;
        } else {
            return false;
        }

        stopGame();
        return true;
    };

    let render = function render() {

        requestAnimationFrame(render);

        ball.processFrame();
        processCPUPaddle();

        renderer.render(scene, camera);
    };

    let init = function init() {

        renderer = new THREE.WebGLRenderer();

        renderer.setSize(cfg.width, cfg.height);
        renderer.setClearColor(0xFCFCFC, 1);
        document.body.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(cfg.view_angle, aspect, cfg.near, cfg.far);
        camera.position.set(0, 250, cfg.field.length / 2 + 600);

        scene = new THREE.Scene();
        scene.add(camera);

        field = new Field(
            new THREE.CubeGeometry(cfg.field.width, 5, cfg.field.length, 1, 1, 1),
            new THREE.MeshLambertMaterial({
                color: 0xF98233
            })
        );

        ball = new Ball(
            new THREE.SphereGeometry(cfg.ball.radius, 16, 16),
            new THREE.MeshLambertMaterial({
                color: 0x0EE3FC
            })
        );

        player1 = addPaddle();
        player1.position.z = cfg.field.length / 2 - 40;

        player2 = addPaddle();
        player2.position.z = -cfg.field.length / 2 + 40;

        //player1Score = document.querySelector('.player1-score').innerHTML;
        //player2Score = document.querySelector('.player2-score').innerHTML;

        mainLight = new THREE.HemisphereLight(0xFFFFFF, 0x1C75A1);
        scene.add(mainLight);

        renderer.domElement.addEventListener('mousemove', containerMouseMove);
    };

    init();
    render();

})(window, window.document, window.THREE);
