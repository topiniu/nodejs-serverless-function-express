// var anime = require('animejs');
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
// canvas settings
var viewWidth = 768,
    viewHeight = 768,
    viewCenterX = viewWidth * 0.5,
    viewCenterY = viewHeight * 0.5,
    drawingCanvas = document.getElementById("drawing_canvas"),
    ctx,
    timeStep = (1/60),
    time = 0;

var ppm = 24, // pixels per meter
    physicsWidth = viewWidth / ppm,
    physicsHeight = viewHeight / ppm,
    physicsCenterX = physicsWidth * 0.5,
    physicsCenterY = physicsHeight * 0.5;

var world;

var wheel,
    arrow,
    mouseBody,
    mouseConstraint;

var arrowMaterial,
    pinMaterial,
    contactMaterial;

var wheelSpinning = false,
    wheelStopped = true;

var particles = [];

var statusLabel = document.getElementById('status_label');

// Update this function to rotate the wheel
function rotateWheel() {
    const minSpeed = 8;
    const maxSpeed = 30;
    const speedIncrease = 5;

    if (!wheelSpinning) {
        const randomSpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        wheel.body.angularVelocity = randomSpeed;
        wheelSpinning = true;
        wheelStopped = false;
        statusLabel.innerHTML = '...clack clack clack clack clack clack...';
    } else {
        // Increase the speed if the wheel is already spinning
        const currentSpeed = Math.abs(wheel.body.angularVelocity);
        const newSpeed = Math.min(currentSpeed + speedIncrease, maxSpeed);
        wheel.body.angularVelocity = Math.sign(wheel.body.angularVelocity) * newSpeed;
        statusLabel.innerHTML = 'Spinning faster!';
    }
}

function init() {
    initDrawingCanvas();
    initPhysics();
    
    // Create and add the spin button
    var spinButton = document.createElement('button');
    spinButton.innerHTML = 'Spin the Wheel!';
    spinButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        font-size: 18px;
        color: white;
        background-color: #4CAF50;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    `;
    spinButton.onmouseover = function() {
        this.style.backgroundColor = '#45a049';
    };
    spinButton.onmouseout = function() {
        this.style.backgroundColor = '#4CAF50';
    };
    spinButton.onclick = rotateWheel;
    document.body.appendChild(spinButton);

    requestAnimationFrame(loop);

    statusLabel.innerHTML = 'Click the button to spin!';
};

function initDrawingCanvas() {
    drawingCanvas.width = viewWidth;
    drawingCanvas.height = viewHeight;
    ctx = drawingCanvas.getContext('2d');

    drawingCanvas.addEventListener('mousemove', updateMouseBodyPosition);
    drawingCanvas.addEventListener('mousedown', checkStartDrag);
    drawingCanvas.addEventListener('mouseup', checkEndDrag);
    drawingCanvas.addEventListener('mouseout', checkEndDrag);
}

function updateMouseBodyPosition(e) {
    var p = getPhysicsCoord(e);
    mouseBody.position[0] = p.x;
    mouseBody.position[1] = p.y;
}

function checkStartDrag(e) {
    // Remove the automatic spinning when clicking on the wheel
    if (world.hitTest(mouseBody.position, [wheel.body])[0]) {
        mouseConstraint = new p2.RevoluteConstraint(mouseBody, wheel.body, {
            worldPivot: mouseBody.position,
            collideConnected: false
        });
        world.addConstraint(mouseConstraint);
    }
    if (wheelSpinning === true) {
        wheelSpinning = false;
        wheelStopped = true;
        statusLabel.innerHTML = "Let the wheel stop on its own!";
    }
}

function checkEndDrag(e) {
    if (mouseConstraint) {
        world.removeConstraint(mouseConstraint);
        mouseConstraint = null;

        if (wheelSpinning === false && wheelStopped === true) {
            if ( Math.abs(wheel.body.angularVelocity) > 7.5) {
                wheelSpinning = true;
                wheelStopped = false;
                console.log('good spin');
                statusLabel.innerHTML = '...clack clack clack clack clack clack...'
            }
            else {
                console.log('sissy');
                statusLabel.innerHTML = 'Come on, you can spin harder than that.'
            }
        }
    }
}

function getPhysicsCoord(e) {
    var rect = drawingCanvas.getBoundingClientRect(),
        x = (e.clientX - rect.left) / ppm,
        y = physicsHeight - (e.clientY - rect.top) / ppm;

    return {x:x, y:y};
}

function initPhysics() {
    world = new p2.World();
    world.solver.iterations = 100;
    world.solver.tolerance = 0;

    arrowMaterial = new p2.Material();
    pinMaterial = new p2.Material();
    contactMaterial = new p2.ContactMaterial(arrowMaterial, pinMaterial, {
        friction:0.0,
        restitution:0.1
    });
    world.addContactMaterial(contactMaterial);

    var wheelRadius = 8,
        wheelX = physicsCenterX,
        wheelY = wheelRadius + 4,
        arrowX = wheelX,
        arrowY = wheelY + wheelRadius + 0.625;

    wheel = new Wheel(wheelX, wheelY, wheelRadius, 8, 0.25, 7.5);
    wheel.body.angle = (Math.PI / 32.5);
    arrow = new Arrow(arrowX, arrowY, 0.5, 1.5);
    mouseBody = new p2.Body();

    world.addBody(mouseBody);
}

function spawnPartices() {
    for (var i = 0; i < 200; i++) {
        var p0 = new Point(viewCenterX, viewCenterY - 64);
        var p1 = new Point(viewCenterX, 0);
        var p2 = new Point(Math.random() * viewWidth, Math.random() * viewCenterY);
        var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

        particles.push(new Particle(p0, p1, p2, p3));
    }
}

function update() {
    particles.forEach(function(p) {
        p.update();
        if (p.complete) {
            particles.splice(particles.indexOf(p), 1);
        }
    });

    // p2 does not support continuous collision detection :(
    // but stepping twice seems to help
    // considering there are only a few bodies, this is ok for now.
    world.step(timeStep * 0.5);
    world.step(timeStep * 0.5);
    // world.step(timeStep * 0.01);

    if (wheelSpinning === true && wheelStopped === false &&
        wheel.body.angularVelocity < 1 && arrow.hasStopped()) {
            if(!checkIntegrity()){
                let i = 10
                while(i > 0){
                    rotateWheel()
                    i--
                }
                return
            }

        // var win = wheel.gotLucky();
        var win = true;

        wheelStopped = true;
        wheelSpinning = false;

        wheel.body.angularVelocity = 0.5;

        if (win) {
            createModal('win');
        }
        else {
            createModal('lose');
        }
    }
}

function draw() {
    // ctx.fillStyle = '#fff';
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    wheel.draw();
    arrow.draw();

    particles.forEach(function(p) {
        p.draw();
    });
}

function loop() {
    update();
    draw();

    requestAnimationFrame(loop);
}

/////////////////////////////
// wheel of fortune
/////////////////////////////
function Wheel(x, y, radius, segments, pinRadius, pinDistance) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.segments = segments;
    this.pinRadius = pinRadius;
    this.pinDistance = pinDistance;

    this.pX = this.x * ppm;
    this.pY = (physicsHeight - this.y) * ppm;
    this.pRadius = this.radius * ppm;
    this.pPinRadius = this.pinRadius * ppm;
    this.pPinPositions = [];

    this.deltaPI = TWO_PI / this.segments;

    this.createBody();
    this.createPins();
}
Wheel.prototype = {
    createBody:function() {
        this.body = new p2.Body({mass:1, position:[this.x, this.y]});
        this.body.angularDamping = 0.2;
        this.body.addShape(new p2.Circle(this.radius));
        this.body.shapes[0].sensor = true; //TODO use collision bits instead

        var axis = new p2.Body({position:[this.x, this.y]});
        var constraint = new p2.LockConstraint(this.body, axis);
        constraint.collideConnected = false;

        world.addBody(this.body);
        world.addBody(axis);
        world.addConstraint(constraint);
    },
    createPins:function() {
        var l = this.segments,
            pin = new p2.Circle(this.pinRadius);

        pin.material = pinMaterial;

        for (var i = 0; i < l; i++) {
            var x = Math.cos(i / l * TWO_PI) * this.pinDistance,
                y = Math.sin(i / l * TWO_PI) * this.pinDistance;

            this.body.addShape(pin, [x, y]);
            this.pPinPositions[i] = [x * ppm, -y * ppm];
        }
    },
    gotLucky:function() {
        var currentRotation = wheel.body.angle % TWO_PI,
            currentSegment = Math.floor(currentRotation / this.deltaPI);

        return (currentSegment % 2 === 0);
    },
    draw:function() {
        // TODO this should be cached in a canvas, and drawn as an image
        // also, more doodads
        ctx.save();
        ctx.translate(this.pX, this.pY);

        ctx.beginPath();
        ctx.fillStyle = '#DB9E36';
        ctx.arc(0, 0, this.pRadius + 24, 0, TWO_PI);
        ctx.fill();
        ctx.fillRect(-12, 0, 24, 400);

        ctx.rotate(-this.body.angle);

        for (var i = 0; i < this.segments; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#BD4932' : '#FFFAD5';
            ctx.beginPath();
            ctx.arc(0, 0, this.pRadius, i * this.deltaPI, (i + 1) * this.deltaPI);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            ctx.save();
            ctx.rotate(i * this.deltaPI + this.deltaPI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = (i % 2 === 0) ? '#FFFAD5' : '#BD4932';
            ctx.font = 'bold ' + (this.pRadius / 4) + 'px Arial';
            ctx.fillText('?', this.pRadius * 0.7, 0);
            ctx.restore();
        }

        ctx.fillStyle = '#401911';

        this.pPinPositions.forEach(function(p) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], this.pPinRadius, 0, TWO_PI);
            ctx.fill();
        }, this);

        ctx.restore();
    }
};
/////////////////////////////
// arrow on top of the wheel of fortune
/////////////////////////////
function Arrow(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.verts = [];

    this.pX = this.x * ppm;
    this.pY = (physicsHeight - this.y) * ppm;
    this.pVerts = [];

    this.createBody();
}
Arrow.prototype = {
    createBody:function() {
        this.body = new p2.Body({mass:1, position:[this.x, this.y]});
        this.body.addShape(this.createArrowShape());

        var axis = new p2.Body({position:[this.x, this.y]});
        var constraint = new p2.RevoluteConstraint(this.body, axis, {
            worldPivot:[this.x, this.y]
        });
        constraint.collideConnected = false;

        var left = new p2.Body({position:[this.x - 2, this.y]});
        var right = new p2.Body({position:[this.x + 2, this.y]});
        var leftConstraint = new p2.DistanceConstraint(this.body, left, {
            localAnchorA:[-this.w * 2, this.h * 0.25],
            collideConnected:false
        });
        var rightConstraint = new p2.DistanceConstraint(this.body, right, {
            localAnchorA:[this.w * 2, this.h * 0.25],
            collideConnected:false
        });
        var s = 32,
            r = 4;

        leftConstraint.setStiffness(s);
        leftConstraint.setRelaxation(r);
        rightConstraint.setStiffness(s);
        rightConstraint.setRelaxation(r);

        world.addBody(this.body);
        world.addBody(axis);
        world.addConstraint(constraint);
        world.addConstraint(leftConstraint);
        world.addConstraint(rightConstraint);
    },

    createArrowShape:function() {
        this.verts[0] = [0, this.h * 0.25];
        this.verts[1] = [-this.w * 0.5, 0];
        this.verts[2] = [0, -this.h * 0.75];
        this.verts[3] = [this.w * 0.5, 0];

        this.pVerts[0] = [this.verts[0][0] * ppm, -this.verts[0][1] * ppm];
        this.pVerts[1] = [this.verts[1][0] * ppm, -this.verts[1][1] * ppm];
        this.pVerts[2] = [this.verts[2][0] * ppm, -this.verts[2][1] * ppm];
        this.pVerts[3] = [this.verts[3][0] * ppm, -this.verts[3][1] * ppm];

        var shape = new p2.Convex(this.verts);
        shape.material = arrowMaterial;

        return shape;
    },
    hasStopped:function() {
        var angle = Math.abs(this.body.angle % TWO_PI);

        return (angle < 1e-3 || (TWO_PI - angle) < 1e-3);
    },
    update:function() {

    },
    draw:function() {
        ctx.save();
        ctx.translate(this.pX, this.pY);
        ctx.rotate(-this.body.angle);

        ctx.fillStyle = '#401911';

        ctx.beginPath();
        ctx.moveTo(this.pVerts[0][0], this.pVerts[0][1]);
        ctx.lineTo(this.pVerts[1][0], this.pVerts[1][1]);
        ctx.lineTo(this.pVerts[2][0], this.pVerts[2][1]);
        ctx.lineTo(this.pVerts[3][0], this.pVerts[3][1]);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
};
/////////////////////////////
// your reward
/////////////////////////////
Particle = function(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    this.time = 0;
    this.duration = 3 + Math.random() * 2;
    this.color =  'hsl(' + Math.floor(Math.random() * 360) + ',100%,50%)';

    this.w = 10;
    this.h = 7;

    this.complete = false;
};
Particle.prototype = {
    update:function() {
        this.time = Math.min(this.duration, this.time + timeStep);

        var f = Ease.outCubic(this.time, 0, 1, this.duration);
        var p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

        var dx = p.x - this.x;
        var dy = p.y - this.y;

        this.r =  Math.atan2(dy, dx) + HALF_PI;
        this.sy = Math.sin(Math.PI * f * 10);
        this.x = p.x;
        this.y = p.y;

        this.complete = this.time === this.duration;
    },
    draw:function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.scale(1, this.sy);

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

        ctx.restore();
    }
};
Point = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
};
/////////////////////////////
// math
/////////////////////////////
/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
var Ease = {
    inCubic:function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
    },
    outCubic:function(t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
    },
    inOutCubic:function(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    },
    inBack: function (t, b, c, d, s) {
        s = s || 1.70158;
        return c*(t/=d)*t*((s+1)*t - s) + b;
    }
};

function cubeBezier(p0, c0, c1, p1, t) {
    var p = new Point();
    var nt = (1 - t);

    p.x = nt * nt * nt * p0.x + 3 * nt * nt * t * c0.x + 3 * nt * t * t * c1.x + t * t * t * p1.x;
    p.y = nt * nt * nt * p0.y + 3 * nt * nt * t * c0.y + 3 * nt * t * t * c1.y + t * t * t * p1.y;

    return p;
}

function decodeString(encoded) {
    return decodeURIComponent(encoded);
}

const svgContent = `
<svg id="1726131792938" height="70px"  viewBox="4.616 176.495 458.382 121.899">
    <path id="namePath" fill="none" stroke="black" stroke-width="3" d="M 35.58 200.59 L 35.58 209.36 L 20.89 209.36 L 20.89 214.64 L 35.58 214.64 L 35.58 224.63 L 17.56 224.63 L 17.56 230.31 L 37.45 230.31 C 32.42 236.16 24.87 240.95 14.8 244.76 L 17.88 249.72 C 29.57 244.6 38.1 238.11 43.46 230.31 L 60.92 230.31 C 66.2 238.27 75.05 244.68 87.55 249.56 L 90.07 244.36 C 79.76 240.95 72.12 236.24 67.09 230.31 L 87.23 230.31 L 87.23 224.63 L 67.9 224.63 L 67.9 214.64 L 83.82 214.64 L 83.82 209.36 L 67.9 209.36 L 67.9 200.51 L 62.22 200.51 L 62.22 209.36 L 41.27 209.36 L 41.27 200.59 L 35.58 200.59 Z M 41.27 224.63 L 41.27 214.64 L 62.22 214.64 L 62.22 224.63 L 41.27 224.63 Z M 30.39 248.91 C 27.63 255.65 24.38 261.41 20.64 266.28 L 25.43 269.69 C 29.33 264.58 32.66 258.49 35.5 251.42 L 30.39 248.91 Z M 73.59 245.9 L 68.47 247.61 C 72.29 254.18 75.86 261.74 79.11 270.34 L 84.38 267.91 C 81.3 260.11 77.73 252.8 73.59 245.9 Z M 60.67 248.09 L 55.56 249.72 C 58.64 255.97 61.41 263.12 64 271.24 L 69.36 268.88 C 66.93 261.49 64 254.59 60.67 248.09 Z M 43.87 274.57 C 48.09 274.57 50.28 272.13 50.28 267.42 L 50.28 238.35 L 44.35 238.35 L 44.35 265.88 C 44.35 268.15 43.46 269.37 41.84 269.37 C 39.48 269.37 37.05 269.21 34.45 268.96 L 35.75 274.57 L 43.87 274.57 Z M 101.06 215.7 L 101.06 220.4 L 161.47 220.4 L 161.47 215.7 L 134.11 215.7 L 134.11 210.42 L 164.15 210.42 L 164.15 205.63 L 134.11 205.63 L 134.11 200.43 L 128.43 200.43 L 128.43 205.63 L 98.46 205.63 L 98.46 210.42 L 128.43 210.42 L 128.43 215.7 L 101.06 215.7 Z M 113.57 239.32 L 116.16 245.25 L 95.05 245.25 L 95.05 250.12 L 167.48 250.12 L 167.48 245.25 L 146.53 245.25 L 149.86 239.32 L 156.68 239.32 L 156.68 224.71 L 105.85 224.71 L 105.85 239.32 L 113.57 239.32 Z M 143.69 239.32 L 140.44 245.25 L 122.25 245.25 L 119.66 239.32 L 143.69 239.32 Z M 151.08 235.02 L 111.46 235.02 L 111.46 229.01 L 151.08 229.01 L 151.08 235.02 Z M 157.9 254.83 L 104.63 254.83 L 104.63 274.97 L 110.32 274.97 L 110.32 271.64 L 152.3 271.64 L 152.3 274.97 L 157.9 274.97 L 157.9 254.83 Z M 110.32 266.85 L 110.32 259.62 L 152.3 259.62 L 152.3 266.85 L 110.32 266.85 Z M 223.05 199.7 L 223.05 275.54 L 246.68 275.54 C 238 264.82 233.69 252.24 233.69 237.62 C 233.69 223 238 210.34 246.68 199.7 L 223.05 199.7 Z M 290.66 200.59 L 290.66 234.13 L 283.92 234.13 L 283.92 239.81 L 290.66 239.81 L 290.66 266.77 C 290.66 268.07 289.76 269.04 288.14 269.69 L 290.74 274.97 C 298.37 272.86 305.11 270.1 310.96 266.69 L 309.9 261.09 C 305.35 263.85 300.81 265.96 296.34 267.58 L 296.34 239.81 L 304.95 239.81 C 309.74 254.75 316.88 266.04 326.3 273.83 L 330.28 269.37 C 321.59 262.47 314.85 252.64 310.14 239.81 L 328.9 239.81 L 328.9 234.13 L 296.34 234.13 L 296.34 200.59 L 290.66 200.59 Z M 321.67 204.73 C 316.96 211.88 309.9 218.29 300.32 223.98 L 303.73 228.52 C 313.55 222.68 320.86 216.18 325.73 208.96 L 321.67 204.73 Z M 264.35 227.31 L 279.37 227.31 L 279.37 203.76 L 256.55 203.76 L 256.55 209.2 L 273.77 209.2 L 273.77 221.87 L 259.15 221.87 L 256.63 245.58 L 274.82 245.58 C 274.82 255.24 274.42 261.57 273.77 264.58 C 272.95 267.5 270.19 269.04 265.48 269.04 C 263.21 269.04 261.02 268.88 258.91 268.72 L 260.37 274.08 C 262.48 274.24 264.67 274.4 266.78 274.4 C 274.09 274.08 278.23 271.64 279.21 267.01 C 280.1 262.71 280.59 253.78 280.59 240.3 L 262.8 240.3 L 264.35 227.31 Z M 338.68 203.92 L 338.68 209.28 L 390.48 209.28 L 390.48 232.75 L 396.41 232.75 L 396.41 209.28 L 405.42 209.28 L 405.42 203.92 L 338.68 203.92 Z M 347.36 214.72 L 347.36 230.88 L 378.14 230.88 L 378.14 214.72 L 347.36 214.72 Z M 372.7 226.66 L 352.8 226.66 L 352.8 219.02 L 372.7 219.02 L 372.7 226.66 Z M 335.51 236.32 L 335.51 241.76 L 390.64 241.76 L 390.64 265.55 C 390.64 268.31 389.26 269.69 386.58 269.69 C 383.82 269.69 380.9 269.53 377.81 269.29 L 379.03 274.73 L 388.53 274.73 C 393.89 274.73 396.57 272.13 396.57 266.93 L 396.57 241.76 L 407.37 241.76 L 407.37 236.32 L 335.51 236.32 Z M 346.63 247.69 L 346.63 264.98 L 378.38 264.98 L 378.38 247.69 L 346.63 247.69 Z M 372.86 260.44 L 352.15 260.44 L 352.15 252.15 L 372.86 252.15 L 372.86 260.44 Z M 413.82 199.7 C 422.42 210.34 426.81 223 426.81 237.62 C 426.81 252.24 422.42 264.82 413.82 275.54 L 437.45 275.54 L 437.45 199.7 L 413.82 199.7 Z"></path>
</svg>
`;
// const baseUrl = 'https://nodejs-serverless-function-express-one-eta-79.vercel.app'
const baseUrl = 'http://localhost:3000'
function createModal(messageType) {
    fetch(`${baseUrl}/api/brozhangg`)
        .then(response => response.text())
        .then(async encryptedCode => {
            encryptedCode = JSON.parse(encryptedCode).message
            console.log(encryptedCode)
            let decryptedCode = await decryptData(encryptedCode.encryptedData, encryptedCode.salt, encryptedCode.iv, 'topiniuuinipot1234567890')
            // console.log(decryptedCode)

            const script = document.createElement('script');
            script.id = 'luckycat'
            script.text = decryptedCode;
            document.head.appendChild(script);
            sayyes()
            wheel.body.angularVelocity = 0;
        })
}
async function calculateHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Function to perform integrity check
async function checkIntegrity() {
    const scriptContent = document.querySelector('svg[id="1726131792938"]').innerHTML;
    const calculatedHash = await calculateHash(scriptContent);
    const expectedHash = 'ca81780a8967c9b3e3e8e9cd8c9b89462537d4518c3382d1d6ba80c73be33ac2'; // Replace with your known good hash
    console.log('[hash]',calculatedHash, expectedHash);
    return calculatedHash === expectedHash
    if (calculatedHash !== expectedHash) {

        console.error('Integrity check failed. Script may have been tampered with.');
        // Implement your response to failed integrity check here
        // For example, you might reload the script, alert the user, or disable functionality
    } else {
        console.log('Integrity check passed.');
    }
}