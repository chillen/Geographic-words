var bgColor = [50,50,50, 255];
var W = 1920;
var H = 1080;
var mainView;
var graphView;
var graphHeight = 200;
var graphWidth = 400;
var mainWidth = W-graphWidth;
var points;
var globalCanvas;
var clickPoints = [];
var mapImages = {};
var activeMap = 'biome';
var mapOffset = {'x':0, 'y':0};
var easing = 0.1;
var dragging = false;
var dataView;
var setupComplete = false;
var selectedPoint = null;

// These values found experimentally for this specific map
// Just the center positions / spacing for each hex
var hexwidth = 46.5
var hmargin = 35
var wmargin = 23.25

function setup() {
    globalCanvas = createCanvas(W, H);
    globalCanvas.parent('sketch');
    mainView = createGraphics(W,H);
    graphView = createGraphics(graphWidth, graphHeight);
    dataView = createGraphics(W, H);
    setupData();
    setTimeout(setupSizes, 1);
    cursor(CROSS);
}

function setupSizes() {
    H = document.getElementById('wrap-wrap').getBoundingClientRect().height;
    W = document.getElementById('wrap-wrap').getBoundingClientRect().width;
    mainWidth = W-graphWidth;
    resizeCanvas(W, H);
    mainView.resizeCanvas(mainWidth, H);
    graphView.resizeCanvas(graphWidth, graphHeight);
    dataView.resizeCanvas(mainWidth, H);
}

function setupData() {
    setupMaps(function() {
        setupPoints();
        setupComplete = true;
    });
}

function draw() {
    if (!setupComplete) return;
    background(0);
    drawMainView();
    drawGraphView();
    drawDataView();
    image(mainView, 0, 0);
    image(graphView, mainWidth, 0);
    image(dataView, 0, 0);
}

function drawMainView() {
    var m = mainView;
    m.background(bgColor);
    moveMap();
    m.image(mapImages[activeMap], mapOffset.x, mapOffset.y);
}

function drawDataView() {
    dataView.clear();
    drawPoints();
    drawClicks();
    drawLine();
    drawData();
}

function drawGraphView() {
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
        return [i++, map(field.at(p[0]-Math.round(mapOffset.x), p[1]-Math.round(mapOffset.y)), 0, 255, graphHeight, 0)];
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
    dataView.ellipseMode(CENTER);
    dataView.stroke([0,0,0,255])
    points.forEach(function(p) { 
        dataView.fill(p.colour);
        dataView.ellipse(p.x+mapOffset.x, p.y+mapOffset.y, 20, 20);
     })
}

function setupMaps(callback) {
    mapImages['biome'] = loadImage("data/biomeMap.png", function() {
        mapImages['height'] = loadImage("data/heightMap.png", function() {
                mapImages['moisture'] = loadImage("data/moistureMap.png", function(m) {
                    mapImages['size'] = {'height': m.height, 'width': m.width};
                    callback();
                });
        });
    });
}

function setupPoints() {
    points = [];
    // mapImages["biome"].loadPixels();
    // for (var x = 0; x*hexwidth < mapImages["size"].width; x++) {
    //     for (var y = 0; y*hexwidth < mapImages["size"].height; y++) {
    //         var yoff = x % 2 == 0? 0.5*hexwidth : 0;
    //         var xpos = Math.floor(x*hexwidth+wmargin);
    //         var ypos = Math.floor(y*hexwidth+hmargin+yoff);
    //         var mapwidth = mapImages["size"].width;
    //         var r = mapImages["biome"].pixels[(xpos*4) + (ypos*4)*mapwidth + 0]
    //         var g = mapImages["biome"].pixels[(xpos*4) + (ypos*4)*mapwidth + 1]
    //         var b = mapImages["biome"].pixels[(xpos*4) + (ypos*4)*mapwidth + 2]
    //         points.push(new Location(xpos, ypos, [r, g, b, 255]));
    //         points[points.length - 1].addField(str(r)+str(g)+str(b), [r,g,b, 255], hexwidth, 255);
    //     }
    // }
}

function drawData() {
    // dataView.loadPixels();
    // points.forEach(function (point) {
    //     point.fields.forEach(function(field) {
    //         for (var i = 0; i < dataView.pixels.length; i+=4) {
    //             var x = Math.floor(i / 4) % dataView.width - Math.round(mapOffset.x);
    //             var y = Math.floor(Math.floor(i / 4) / dataView.width  - Math.round(mapOffset.y));
    //             if (field.x - field.radius < x && x < field.x + field.radius) {
    //                 if (field.y - field.radius < y && y < field.y + field.radius) {
    //                     dataView.pixels[i] += (field.colour[0] / 255) * field.data[x][y];
    //                     dataView.pixels[i+1] += (field.colour[1] / 255) * field.data[x][y];
    //                     dataView.pixels[i+2] += (field.colour[2] / 255) * field.data[x][y];
    //                     dataView.pixels[i+3] = 255
    //                 }
    //             }
    //         }
    //     });
    // });
    // dataView.updatePixels()
}

function windowResized() {
  setupSizes();
}

// MOUSE DRAGGING HANDLING BELOW
function mouseDragged() {
    if (keyIsDown(SHIFT)) {
        dragging = true;
    }
    else {
        if (mouseX > mainWidth || mouseY > H || mouseX < 0 || mouseY < 0) {
            return;
        }
        if (clickPoints.length == 2)
            clickPoints[1] = [mouseX, mouseY]
    }
}

function mousePressed() {
    if (mouseX > mainWidth || mouseX < 0 || mouseY < 0 || mouseY > H) {
        return
    }
    if (mouseButton == LEFT) {
        clickPoints = [ [mouseX, mouseY] ];
        if (!keyIsDown(SHIFT)) 
            clickPoints.push([mouseX, mouseY]);
    }
}

function drawClicks() {
    crossLength = 5
    if (clickPoints.length < 2) return;
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

// DOM Controls
function swapMap(type) {
    activeMap = type;
}

function moveMap() {
    if (!dragging) return;
    if (dragging && !mouseIsPressed) {
        dragging = false;
        return;
    }
    mapOffset.x += (mouseX - clickPoints[0][0])*easing;
    mapOffset.y += (mouseY - clickPoints[0][1])*easing;
}

function mouseClicked() {

    if (!keyIsDown(CONTROL)) return;

    var loc = {x: Math.round(mouseX - mapOffset.x), y: Math.round(mouseY - mapOffset.y)};
    var sidebar = document.querySelector('#menu');
    var main = sidebar.querySelector("#main-view");
    var newpoint = sidebar.querySelector(".new-point-form");
    newpoint.querySelector("#x").setAttribute("value", loc.x);
    newpoint.querySelector("#y").setAttribute("value", loc.y);
    main.style.display = "none";
    newpoint.style.display = "block";
    var inputs = document.querySelectorAll('.mdl-textfield');
    inputs.forEach(d => d.MaterialTextfield.checkDirty());
}

function addPoint() {
    var sidebar = document.querySelector('#menu');
    var main = sidebar.querySelector("#main-view");
    var newpoint = sidebar.querySelector(".new-point-form");
    var x = parseInt(newpoint.querySelector("#x").value);
    var y = parseInt(newpoint.querySelector("#y").value);
    var name = newpoint.querySelector("#name").value;
    var radius = parseInt(newpoint.querySelector("#radius").value);
    main.style.display = "block";
    newpoint.style.display = "none";
    points.push(new Location(x, y, [200, 150, 100, 255]));
    selected = points[points.length-1];
    points[points.length - 1].addField(name, [200, 150, 100, 255], radius, 255);
    // points[points.length - 1].fields.forEach(field => field.emit(mapImages.size.width, mapImages.size.height))
    console.log(newpoint.querySelector("#name"));
}

function cancelAddPoint() {
    var sidebar = document.querySelector('#menu');
    var main = sidebar.querySelector("#main-view");
    var newpoint = sidebar.querySelector(".new-point-form");
    main.style.display = "block";
    newpoint.style.display = "none";
    selected = null;
}