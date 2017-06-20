var bgColor = [50,50,50, 255];
var W = 1920;
var H = 1080;
var mainView;
var graphView;
var graphHeight = 200;
var graphWidth = 400;
var mainWidth = W-graphWidth;
var canvas;
var points;
var globalCanvas;
var clickPoints = [];

function setup() {
    globalCanvas = createCanvas(W, H);
    globalCanvas.parent('sketch');
    mainView = createGraphics(W,H);
    graphView = createGraphics(graphWidth, graphHeight);
    canvas = createImage(W, H);
    setupData();
    setTimeout(setupSizes, 1)
    cursor(CROSS)
}

function setupSizes() {
    H = document.getElementById('wrap-wrap').getBoundingClientRect().height;
    W = document.getElementById('wrap-wrap').getBoundingClientRect().width;
    mainWidth = W-graphWidth;
    canvas.resize(W, H);
    setupData();
    resizeCanvas(W, H);
    mainView.resizeCanvas(mainWidth, H);
    graphView.resizeCanvas(graphWidth, graphHeight)
}

function setupData() {
    setupPoints();
    updateFields();
    drawData();
}

function draw() {
    background(0);
    drawMain();
    drawGraph();
    image(mainView, 0, 0);
    image(graphView, mainWidth, 0);
}

function drawMain() {
    var m = mainView;
    m.background(bgColor);
    m.image(canvas, 0, 0);
    drawPoints();
    drawClicks();
    drawLine();
}

function drawGraph() {
    var g = graphView;
    g.background([0,0,0, 255]);
    g.stroke([40, 40, 40, 255]);
    g.strokeWeight(1);
    for (var i = 0; i < Math.max(graphHeight, graphWidth); i+=10) {
        g.line(0, i, g.width, i);
        g.line(i, 0, i, g.height);
    }
    if (clickPoints.length != 2) return;
    var clickSort = [0, 0];
    if (clickPoints[0][0] > clickPoints[1][0]) {
        clickSort = [clickPoints[1], clickPoints[0]];
    }
    else {
        clickSort = [clickPoints[0], clickPoints[1]];
    }
    var curveLine = pointsBetween(clickSort);
    if (curveLine.length < 2) return;
    points.forEach(function(p) {
        p.fields.forEach(function(f) {
            drawGraphData(f, curveLine);
        });
    });
}

function drawGraphData(field, curvePoints) {
    var i = 0;
    var g = graphView;
    curvePoints = curvePoints.map(function(p) {
        return [i++, map(field.data[p[0]][p[1]], 0, 255, graphHeight, 0)];
    });
    g.stroke(field.colour);
    g.strokeWeight(2);
    g.noFill();
    g.beginShape();
    g.curveVertex(curvePoints[0][0], curvePoints[0][1]);
    curvePoints.forEach(function(p) {
        g.curveVertex(p[0], p[1]);
    });
    g.curveVertex(curvePoints[curvePoints.length - 1][0], curvePoints[curvePoints.length - 1][1]);
    g.endShape();
}

function drawPoints() {
    mainView.ellipseMode(CENTER);
    mainView.noStroke();
    points.forEach(function(p) { 
        mainView.fill(p.colour);
        mainView.ellipse(p.x, p.y, 20, 20)
     })
}

function setupCanvas() {
    canvas.loadPixels();
    for (var x = 0; x < canvas.width; x++) {
        for (var y = 0; y < canvas.height; y++) {
            canvas.set(x, y, bgColor)
        }
    }
    canvas.updatePixels()
}

function setupPoints() {
    points = [];
    points.push(new Location(mainWidth/2, H/2, [50,100,70,255]));
    var i = [ [70, 1000] ]
    points[points.length - 1].addField("green", [50,100,70,255], 500, 255, i);

    points.push(new Location(mainWidth/2-80, H/2-140, [50,50,100,255]));
    var i = [ [200, -255], [200, 500] ]
    points[points.length - 1].addField("green", [50,50,100,255], 300, 255, i);
}

function updateFields() {
    points.forEach(function(point) {
        point.fields.forEach(function(field) {
            field.emit(W, H);
        });
    });
}

function drawData() {
    setupCanvas();
    this.canvas.loadPixels();
    points.forEach(function (point) {
        point.fields.forEach(function(field) {
            for (var i = 0; i < this.canvas.pixels.length; i+=4) {
                var x = Math.floor(i / 4) % W;
                var y = Math.floor(Math.floor(i / 4) / W);
                if (field.x - field.radius < x && x < field.x + field.radius) {
                    if (field.y - field.radius < y && y < field.y + field.radius) {
                        this.canvas.pixels[i] += (field.colour[0] / 255) * field.data[x][y];
                        this.canvas.pixels[i+1] += (field.colour[1] / 255) * field.data[x][y];
                        this.canvas.pixels[i+2] += (field.colour[2] / 255) * field.data[x][y];
                        this.canvas.pixels[i+3] = 255
                    }
                }
            }
        });
    });
    canvas.updatePixels()
}

function windowResized() {
  setupSizes();
}

// MOUSE DRAGGING HANDLING BELOW
function mouseDragged() {
    if (mouseX > mainWidth || mouseY > H || mouseX < 0 || mouseY < 0) {
        return;
    }
    clickPoints[1] = [mouseX, mouseY]
}

function mousePressed() {
    if (mouseX > mainWidth || mouseX < 0 || mouseY < 0 || mouseY > H) {
        return
    }
    if (mouseButton == LEFT) {
        clickPoints = [ [mouseX, mouseY], [mouseX, mouseY] ];
    }
}

function drawClicks() {
    crossLength = 5
    clickPoints.forEach(function(p) {
        mainView.strokeWeight(1);
        mainView.stroke(0);
        mainView.line(p[0]-crossLength, p[1], p[0]+crossLength, p[1]);
        mainView.line(p[0], p[1]-crossLength, p[0], p[1]+crossLength);
    });
}

function drawLine() {
    if (clickPoints.length == 2) {
        mainView.strokeWeight(1);
        mainView.stroke(220, 200, 50);
        mainView.line(clickPoints[0][0], clickPoints[0][1], clickPoints[1][0], clickPoints[1][1]);
    }
}

function pointsBetween(points) {
    function roundPoint(p) {
        return [Math.round(p[0]), Math.round(p[1])];
    }
    function diagDist(points) {
        var dx = points[0][0] - points[1][0];
        var dy = points[1][0] - points[0][1];
        return Math.max(Math.abs(dx), Math.abs(dy));
    }
    function lerp(s, e, t) {
        return s+t*(e-s);
    }
    function lerpPoints(points, t) {
        return [lerp(points[0][0], points[1][0], t), lerp(points[0][1], points[1][1], t)];
    }
   var N = diagDist(points);
   var linePoints = []
   if (N == 0) return;
   for (var i = 0; i < N; i++) {
       t = i/N;
       linePoints.push(roundPoint(lerpPoints(points, t)));
   }
   return linePoints;
}

