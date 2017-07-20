var view = {main: null, graph: null, points: null, graph: null}
var points;
var clickPoints = [];
var mapImages = {};
var activeMap = 'biome';
var mapOffset = {'x':0, 'y':0};
var easing = 0.1;
var dragging = false;
var selectedPoint = null;
var mapDetails = { hex: {width: 46.5, hMargin: 35, wMargin: 23.25}, height: 2048, width: 2048 }

function setup() {
    noLoop();
    cursor(CROSS);
    createGraphics(100, 100);
    init.loadMaps()
    .then(maps => mapImages = maps)
    .then(function() {
        view['main'] = createGraphics(100, 100);
        view['data'] = createGraphics(mapDetails.width, mapDetails.height);
        view['field'] = createGraphics(mapDetails.width,mapDetails.height);
        view['graph'] = createGraphics(400, 200);
        setupSizes();
    })
    .then(setupPoints)
    .then(loop())
}

// I'm not sure why, but it takes 0<x<1ms to get height
function setupSizes() {
    setTimeout(function() {
        let H = document.getElementById('wrap-wrap').getBoundingClientRect().height;
        let W = document.getElementById('wrap-wrap').getBoundingClientRect().width;
        resizeCanvas(W, H)
        view["main"].width = W;
        view["main"].height = H;
        view["main"].resizeCanvas(W, H);
    }, 1);
}

function draw() {
    try {
        background(0);
        drawMainView();
        drawGraphView();
        drawDataView();
        image(view["main"], 0, 0);
        image(view["field"], mapOffset.x, mapOffset.y);
        image(view["data"], mapOffset.x, mapOffset.y);
        image(view["graph"], view["main"].width-view["graph"].width, view["main"].height-view["graph"].height);
    }
    catch (e) {
        console.log("Loading...");
    }
}

function drawMainView() {
    let m = view["main"];
    m.background([50,50,50, 255]);
    moveMap();
    m.image(mapImages[activeMap], mapOffset.x, mapOffset.y);
}

function drawDataView() {
    //view["data"].clear();
    drawData();
    drawPoints();
    drawClicks();
    drawLine();
}

function drawGraphView() {
    let g = view["graph"];
    g.background([0,0,0, 150]);
    g.stroke([40, 40, 40, 150]);
    g.strokeWeight(1);
    for (let i = 0; i < Math.max(g.height, g.width); i+=10) {
        g.line(0, i, g.width, i);
        g.line(i, 0, i, g.height);
    }
    if (clickPoints.length != 2) return;
    let clickSort = [0, 0];
    if (clickPoints[0][0] > clickPoints[1][0]) {
        clickSort = [clickPoints[1], clickPoints[0]];
    }
    else {
        clickSort = [clickPoints[0], clickPoints[1]];
    }
    let curveLine = pointsBetween(clickSort);
    if (curveLine.length < 2) return;
    points.forEach(function(p) {
        p.fields.forEach(function(f) {
            drawGraphData(f, curveLine);
        });
    });
}

function drawGraphData(field, curvePoints) {
    var i = 0;
    var g = view["graph"];
    curvePoints = curvePoints.map(function(p) {
        return [i++, map(field.at(p[0]-Math.round(mapOffset.x), p[1]-Math.round(mapOffset.y)), 0, 1, g.height, 0)];
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
    view["data"].ellipseMode(CENTER);
    view["data"].noStroke()
    for (let point of points) {
        view["data"].fill(point.colour);
        view["data"].ellipse(point.x, point.y, 20, 20);
    }
}

function setupPoints() {
    points = [];
    points.push(new Location(766, 708, [200, 150, 50, 255]));
    points[points.length-1].addField("test", [200, 200, 0, 255], 300);
    points.push(new Location(625, 500, [200, 150, 50, 255]));
    points[points.length-1].addField("test", [200, 0, 0, 255], 300);
}

function drawData() {
    let loaded = false;
    for (let point of points) {
        for (let field of point.fields) {
            if (field.displayed)
                continue;
            if (!loaded) {
                loaded = true;
                view["field"].loadPixels();
            }
            for (let x in field.data) {
                for (let y in field.data[x]) {
                    let pos = Math.ceil(x) * 4 + Math.ceil(y) * 4 * view["field"].width;
                    view["field"].pixels[pos] += (field.colour[0]) * (field.at(x,y) / 1);
                    view["field"].pixels[pos+1] += (field.colour[1]) * (field.at(x,y) / 1);
                    view["field"].pixels[pos+2] += (field.colour[2]) * (field.at(x,y) / 1);
                    view["field"].pixels[pos+3] += 255 * (field.at(x,y) / 1);
                    field.displayed = true;
                }
            }
        }
    }
    if (loaded == true)
        view["field"].updatePixels();
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
        if (mouseX > view["main"].width || mouseY > view["main"].height || mouseX < 0 || mouseY < 0) {
            return;
        }
        if (clickPoints.length == 2) {
            clickPoints[1] = [mouseX, mouseY]
        }
    }
}

function mousePressed() {
    if (mouseX > view["main"].width || mouseX < 0 || mouseY < 0 || mouseY > view["main"].height) {
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
        view["main"].strokeWeight(1);
        view["main"].stroke(0);
        view["main"].line(p[0]-crossLength, p[1], p[0]+crossLength, p[1]);
        view["main"].line(p[0], p[1]-crossLength, p[0], p[1]+crossLength);
    });
}

function drawLine() {
    if (clickPoints.length == 2) {
        view["main"].strokeWeight(1);
        view["main"].stroke(220, 200, 50);
        view["main"].line(clickPoints[0][0], clickPoints[0][1], clickPoints[1][0], clickPoints[1][1]);
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
    points[points.length - 1].addField(name, [200, 150, 100, 255], radius);
    // points[points.length - 1].fields.forEach(field => field.emit(mapDetails.width, mapDetails.height))
}

function cancelAddPoint() {
    var sidebar = document.querySelector('#menu');
    var main = sidebar.querySelector("#main-view");
    var newpoint = sidebar.querySelector(".new-point-form");
    main.style.display = "block";
    newpoint.style.display = "none";
    selected = null;
}