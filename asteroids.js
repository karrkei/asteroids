"use strict";
// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing
// Name: Cheong Karr Kei
// Student ID: 30091497
function asteroids() {
    // Inside this function you will use the classes and functions 
    // define;d in svgelement.ts and observable.ts
    // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
    // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!  
    // Explain which ideas you have used ideas from the lectures to 
    // create reusable, generic functions.
    var svg = document.getElementById("canvas"), keydown = Observable.fromEvent(document, 'keydown'), keyup = Observable.fromEvent(document, 'keyup');
    // make a group for the spaceship and a transform to move it and rotate it
    // to animate the spaceship you will update the transform property
    var g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)");
    // group for the asteroids
    var a = new Elem(svg, 'a')
        .attr("transform", "translate(300 300) rotate(0)");
    // create a polygon shape for the space ship as a child of the transform group
    var ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 0,10 15,20 0,-20 ")
        .attr("style", "fill:white;stroke:black;stroke-width:1")
        .attr('lives', 3), 
    /*
    shipX = x position of the ship
    shipY = y position of the ship
    rotation = rotation of the ship
    crashed = a boolean to keep track of whether the ship has crashed into an asteroid
    game duration = the duration of the game
    */
    shipX = 0, shipY = 0, rotation = 0, crashed = false, game_duration = 500000, lives = 3;
    //an ellipse with the same centre as the ship, used to 'explode' the ship
    var ship_bound = new Elem(svg, 'ellipse', g.elem)
        .attr('style', 'fill:none;stroke:none;stroke-width:0')
        .attr('cx', shipX)
        .attr('cy', shipY)
        .attr('rx', 30)
        .attr('ry', 30);
    //to keep track of the score and display it 
    var score = 0;
    var game_display = document.getElementById("display");
    game_display.innerHTML = "Score:   " + String(score) + " Lives: " + lives;
    //asteroids
    /*
    Got these points from https://github.com/caseyscarborough/j-asteroids/blob/master/src/asteroids/Asteroid.java , they are the points for creating the asteroid
    polygons.
    */
    var points = "10,0 13,2 26,1 30,8 29,15 31,20 26,31 22,31 8,29 1,22 2,16 1,7 4,0", 
    /*
    startingPos is an array of starting positions for the asteroids. for each array in the array, x position is stored at index 0, y position at index 1 and angle
    at index 3.
    */
    startingPos = [[-300, -300, 135], [-300, 300, 45], [300, -300, 225], [300, 300, 315], [0, 300, 360], [0, -300, 180], [300, 0, 270], [-300, 0, 90]], 
    //asteroids_list is a list I have created to keep track of the current asteroids elements generated that have not been shot.
    asteroids_list = [];
    //functions
    function getRandomNum(min, max) {
        //this function takes in two numbers, min and max, generates a random number between min and max inclusive and returns it 
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // updatePositionX and updatePositionY are taken from https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code and modified accordingly
    function updatePositionX(positionX, speed, angle) {
        /*
        this function takes in 3 numbers, positionX (current x position of the element), speed (the speed that the element is supposed to move at), and
        angle (direction in which the element is supposed to move towards next) and generates the next x position for the element.
        */
        var rad = angle * (Math.PI / 180);
        positionX += (Math.sin(rad) * speed);
        return positionX < -300 ? 300 : (positionX > 300 ? -300 : positionX);
    }
    function updatePositionY(positionY, speed, angle) {
        /*
        this function takes in 3 numbers, positionY (current y position of the element), speed (the speed that the element is supposed to move at), and
        angle (direction in which the element is supposed to move towards next) and generates the next y position for the element.
        */
        var rad = angle * (Math.PI / 180);
        positionY -= (Math.cos(rad) * speed);
        return positionY < -300 ? 300 : (positionY > 300 ? -300 : positionY);
    }
    function bulletX(positionX, rotation) {
        /*
        this function takes in 2 numbers, positionX (current y position of the bullet) and rotation (direction in which the bullet is supposed to move towards
        next) and generates the next y position for the bullet. I have created a separate function from updatePosition X because I don't want the bullets to wrap
        around.
        */
        var rad = rotation * (Math.PI / 180);
        positionX += (Math.sin(rad) * 25);
        return positionX;
    }
    function bulletY(positionY, rotation) {
        /*
        this function takes in 2 numbers, positionX (current y position of the bullet) and rotation (direction in which the bullet is supposed to move towards
        next) and generates the next y position for the bullet. I have created a separate function from updatePosition X because I don't want the bullets to wrap
        around.
        */
        var rad = rotation * (Math.PI / 180);
        positionY -= (Math.cos(rad) * 25);
        return positionY;
    }
    function getspeed(size) {
        //this function returns a speed for the asteroid relative to its size (higher speed for smaller asteroid)
        return size === 2 ? 25 : size === 3 ? 20 : 0;
    }
    function removeShotAsteroids() {
        /*
        this function removes the asteroids elements that have been shot and updates asteroids_list.
        this function will create a side effect.
        */
        asteroids_list = Array.from(a.elem.children);
        var asteroids_remove = asteroids_list.filter(function (asteroid) { return Number(asteroid.getAttribute('shot')) >= 1; });
        asteroids_remove.forEach(function (asteroid) { return a.elem.removeChild(asteroid); });
        asteroids_list = Array.from(a.elem.children);
    }
    function checkCollision(asteroid, lives) {
        /*
        this function takes in an asteroid Element and a number lives. it checks for collision by calculating the distance between the asteroid and the ship
        and returns a number which will then be the number of lives remaining.
        */
        var distance = Math.sqrt(Math.pow((shipX - (Number(asteroid.getAttribute('asteroidX')) + (asteroid.getBoundingClientRect().width) / 2)), 2)
            + Math.pow((shipY - (Number(asteroid.getAttribute('asteroidY')) + (asteroid.getBoundingClientRect().height) / 2)), 2));
        return distance <= 20 + asteroid.getBoundingClientRect().height / 2 ? lives - 1 : lives;
    }
    function checkAsteroid(asteroid) {
        /*
        this function takes in an asteroid Element and a boolean crashed. it checks for collision by calculating the distance between the asteroid and the ship
        and returns an array of asteroid elements to be removed in the event that a collision has occured.
        */
        var distance = Math.sqrt(Math.pow((shipX - (Number(asteroid.getAttribute('asteroidX')) + (asteroid.getBoundingClientRect().width) / 2)), 2)
            + Math.pow((shipY - (Number(asteroid.getAttribute('asteroidY')) + (asteroid.getBoundingClientRect().height) / 2)), 2));
        return distance <= 20 + asteroid.getBoundingClientRect().height / 2 ? [asteroid] : [];
    }
    function explodeShip(lives_diff) {
        /*
        this function takes in a number lives_diff, which checks whether a collision had occured and then a string that can be set as the attribute 'style' of
        the ship_bound that makes the ship_bound visibile will be returned.
        */
        return lives_diff === 1 ? 'fill:red;stroke:red;stroke-width:2' : 'fill:none;stroke:none;stroke-width:0';
    }
    function checkShot(bullet, asteroid) {
        /*
        this function takes in two elements, bullet and asteroid and checks if the bullet has hit the asteroid by calculating the distance. if the asteroid has been
        shot then a string which increases the 'shot' attribute of the asteroid is returned.
        */
        var distance = Math.sqrt(Math.pow((Number(bullet.attr('cx')) - (Number(asteroid.getAttribute('asteroidX')) + (asteroid.getBoundingClientRect().width) / 2)), 2)
            + Math.pow((Number(bullet.attr('cy')) - (Number(asteroid.getAttribute('asteroidY')) + (asteroid.getBoundingClientRect().height) / 2)), 2));
        return distance <= asteroid.getBoundingClientRect().height / 2 ? String(Number(asteroid.getAttribute('shot')) + 1) : String(Number(asteroid.getAttribute('shot')));
    }
    function addScore(shot, size, score) {
        /*
        this function takes in three numbers, shot, size and score which are attributes from an asteroid and then calculates the score to be added according to their
        sizes and returns it.
        */
        return shot === 1 && size === 2 ? score + 20 : (shot === 1 && size === 3 ? score + 10 : score);
    }
    function clearOld() {
        /*
        this function is used to return an array of asteroid elements that have been on-screen for longer than a set duration of time to be removed.
        */
        var clearold = Array.from(a.elem.children);
        return clearold.length > 0 ?
            clearold.filter(function (asteroid) { return Number(asteroid.getAttribute('duration')) >= 30 &&
                (Number(asteroid.getAttribute('asteroidX')) >= 600 || Number(asteroid.getAttribute('asteroidX')) <= 600) &&
                (Number(asteroid.getAttribute('asteroidY')) >= 600 || Number(asteroid.getAttribute('asteroidY')) <= 600); }) :
            [];
    }
    function terminateGame() {
        /*
        this function is used to terminate the game once the player runs out of lives by removing all the asteroids.
        it creates side effects.
        */
        var asteroids = Array.from(a.elem.children);
        asteroids.forEach(function (asteroid) { return a.elem.removeChild(asteroid); });
        game_duration = 0;
        game_display.innerHTML = display(lives);
    }
    function endGame(lives) {
        /*
        this function takes in the number of lives left and returns null if there are still lives remaining or a function to terminate the game once all lives have
        been lost.
        */
        return lives > 0 && lives <= 3 ? null : terminateGame();
    }
    function display(lives) {
        /*
        this function takes in the number of lives left and returns a string to be displayed.
        */
        return lives > 0 && lives <= 3 ? "Score:   " + score + " Lives: " + lives : "GAME OVER. Your score: " + score;
    }
    //Observable to create and move asteroids
    Observable
        .interval(2000)
        .takeUntil(Observable.interval(game_duration))
        .subscribe(function () {
        //coordinates is a random number between 0 and 7 (the length of starting positions list-1) so that we can randomly choose from the list of starting positions
        var coordinates = getRandomNum(0, 7), 
        //asteroidX is the starting x position of the asteroid   
        asteroidX = (startingPos[coordinates])[0], 
        //asteroidY is the starting y position of the asteroid  
        asteroidY = (startingPos[coordinates])[1], 
        //angle is the angle in which the asteroid is supposed to move at
        angle = (startingPos[coordinates])[2], 
        //size is a random number between 2 and 3 which are the two different sizes of asteroids
        size = getRandomNum(2, 3), 
        //speed is the speed that the asteroid is going to move at (chosen relative to its size)
        speed = getspeed(size);
        //creating asteroids
        var asteroids = new Elem(svg, 'polygon', a.elem)
            .attr("style", "fill:white;stroke:black;stroke-width:1")
            .attr("points", points)
            .attr("transform", "translate(" + asteroidX + " " + asteroidY + ") scale(" + size + ")")
            //added attribute shot which keeps track of whether an asteroid has been shot. 0=not shot
            .attr("shot", 0)
            //added attribute asteroidX which is the x position of the asteroid
            .attr('asteroidX', asteroidX)
            //added attribute asteroidY which is the xyposition of the asteroid
            .attr('asteroidY', asteroidY)
            //added attribute angle which is the angle at which the asteroid moves
            .attr('angle', angle)
            //added attribute size which is the size (scale) of the asteroid 
            .attr('size', size)
            //added attribute speed which is the speed at which the asteroid moves  
            .attr('speed', speed)
            //added attribute duration which keeps track of how long the asteroid has been on-screen 
            .attr('duration', 0);
        //remove asteroids that have been shot 
        removeShotAsteroids();
        //iterate through the list of asteroids to check for collision to update the lives accordingly as well as create the (silly-looking) explosion
        asteroids_list.forEach(function (asteroid) {
            var lives_before = lives;
            lives = checkCollision(asteroid, lives);
            var lives_diff = lives_before - lives;
            ship_bound.attr('style', explodeShip(lives_diff));
            //remove asteroid that crashed with the ship so that the ship doesn't keep losing lives as the asteroid continues to be at the same position
            checkAsteroid(asteroid).forEach(function (asteroid) {
                a.elem.removeChild(asteroid);
            });
        });
        //moving the asteroids                 
        Observable
            .interval(150)
            .takeUntil(Observable.interval(2000))
            .subscribe(function () {
            //move asteroids to their next positions
            Array.from(a.elem.children).forEach(function (asteroid) {
                asteroid.setAttribute("transform", "translate(" + updatePositionX(Number(asteroid.getAttribute('asteroidX')), Number(asteroid.getAttribute('speed')), Number(asteroid.getAttribute('angle'))) + " \n          " + updatePositionY(Number(asteroid.getAttribute('asteroidY')), Number(asteroid.getAttribute('speed')), Number(asteroid.getAttribute('angle'))) + ") scale(" + Number(asteroid.getAttribute('size')) + ") ");
                asteroidX = updatePositionX(Number(asteroid.getAttribute('asteroidX')), Number(asteroid.getAttribute('speed')), Number(asteroid.getAttribute('angle')));
                asteroidY = updatePositionY(Number(asteroid.getAttribute('asteroidY')), Number(asteroid.getAttribute('speed')), Number(asteroid.getAttribute('angle')));
                asteroid.setAttribute('asteroidX', String(asteroidX));
                asteroid.setAttribute('asteroidY', String(asteroidY));
                asteroid.setAttribute('duration', String(Number(asteroid.getAttribute('duration')) + 1));
            });
            //remove asteroids that have been shot 
            removeShotAsteroids();
            //iterate through the list of asteroids to check for collision to update the lives accordingly as well as create the (silly-looking) explosion
            asteroids_list.forEach(function (asteroid) {
                var lives_before = lives;
                lives = checkCollision(asteroid, lives);
                var lives_diff = lives_before - lives;
                ship_bound.attr('style', explodeShip(lives_diff));
                //remove asteroid that crashed with the ship so that the ship doesn't keep losing lives as the asteroid continues to be at the same position
                checkAsteroid(asteroid).forEach(function (asteroid) {
                    a.elem.removeChild(asteroid);
                });
            });
        });
    });
    //Observable to check whether or not to terminate the game, clear asteroids that have been on-screen for a set amount of time and changes the display.
    Observable
        .interval(100)
        .takeUntil(Observable.interval(game_duration))
        .subscribe(function () {
        var x = endGame(lives);
        var toClear = clearOld();
        toClear.forEach(function (asteroid) { return a.elem.removeChild(asteroid); });
        game_display.innerHTML = display(lives);
    });
    //moving ship
    //keycodes for: up = 38, down = 40, left =37, right = 39, space 32
    //Observable to rotate the ship anti-clockwise if left key is pressed and clockwise if right key is pressed.
    keydown
        .filter(function (_a) {
        var keyCode = _a.keyCode;
        return (keyCode === 37 || keyCode == 39) && (lives > 0 && lives <= 3);
    })
        .map(function (_a) {
        var keyCode = _a.keyCode;
        return ({
            rotation: keyCode === 37 ? rotation = (rotation - 20) % 360 : (keyCode === 39 ? rotation = (rotation + 20) % 360 : rotation),
        });
    })
        .subscribe(function (_a) {
        var rotation = _a.rotation;
        ship.attr("transform", "translate(" + shipX + " " + shipY + ") rotate(" + rotation + ")");
    });
    //Observable to move the ship forward when the up key is pressed.
    keydown
        .filter(function (_a) {
        var keyCode = _a.keyCode;
        return keyCode === 38 && (lives > 0 && lives <= 3);
    })
        .subscribe(function () {
        Observable.interval(50)
            .takeUntil(Observable.interval(400))
            .subscribe(function () {
            //starting thrust speed
            var thrust_speed = 15;
            //translate the ship using x and y positions obtained through the functions updatePositionX() and updatePositionY() 
            ship.attr("transform", "translate(" + updatePositionX(shipX, thrust_speed, rotation) + " " + updatePositionY(shipY, thrust_speed, rotation) + ") rotate(" + rotation + ")");
            //update ship's x position 
            shipX = updatePositionX(shipX, thrust_speed, rotation);
            //update ship's y position 
            shipY = updatePositionY(shipY, thrust_speed, rotation);
            //decrease thrust speed by 5 each time
            thrust_speed -= 5;
            //the ship bound has to be 'translated' together too!
            ship_bound.attr('cx', shipX).attr('cy', shipY).attr('rx', 20).attr('ry', 20);
        });
    });
    //Observable to shoot bullets if space bar is pressed.
    keydown
        .filter(function (_a) {
        var keyCode = _a.keyCode;
        return keyCode === 32 && (lives > 0 && lives <= 3);
    })
        .map(function () { return ({
        rotation: rotation
    }); })
        .subscribe(function (_a) {
        var rotation = _a.rotation;
        //create bullet (an ellipse) once space bar is pressed, using the x and y positions of ship as the centre.
        var bullet = new Elem(svg, 'ellipse', g.elem)
            .attr('style', 'fill:red;stroke:black;stroke-width:1')
            .attr('cx', shipX).attr('cy', shipY).attr('rx', 0).attr('ry', 0);
        Observable
            .interval(50)
            .takeUntil(Observable.interval(1500))
            .subscribe(function () {
            //move bullet to next positions to get the 'shooting' effect by using the functions bulletX() and bulletY()
            bullet.attr('cx', bulletX(Number(bullet.attr('cx')), rotation))
                .attr('cy', bulletY(Number(bullet.attr('cy')), rotation))
                .attr('rx', 3).attr('ry', 3)
                .attr('rx', 3).attr('ry', 3);
            //checks whether the bullet has hit any asteroids, updates the asteroids' 'shot' attribute accordingly, calculates the score and update accordingly.        
            asteroids_list.forEach(function (asteroid) {
                asteroid.setAttribute('shot', checkShot(bullet, asteroid));
                var shot = Number(asteroid.getAttribute('shot')), size = Number(asteroid.getAttribute('size'));
                score = addScore(shot, size, score);
                removeShotAsteroids();
            });
        });
        //clear old bullets 
        Observable
            .interval(1500)
            .takeUntil(Observable.interval(1600))
            .subscribe(function () { g.elem.removeChild(g.elem.children[2]); });
    });
}
// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
    window.onload = function () {
        asteroids();
    };
