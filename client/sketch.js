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
    createGraphics(1000, 1000).parent('sketch');
    cursor(CROSS);
    init.loadMaps()
    .then(loadedMaps => mapImages = loadedMaps)
    .then(createScenes)
    .then(setupSizes)
    .then(init.loadPoints)
    .then(p => points = p)
}

function createScenes() {
    view['main'] = createGraphics(10, 10);
    view['data'] = createGraphics(mapDetails.width, mapDetails.height);
    view['field'] = createGraphics(mapDetails.width,mapDetails.height);
    view['graph'] = createGraphics(400, 200);
}

// I'm not sure why, but it takes 0<x<1ms to get height
function setupSizes() {
    setTimeout(function() {
        let MW = document.getElementById('menu').offsetWidth;
        let H = document.getElementById('sketch-wrapper').clientHeight;
        let W = document.getElementById('sketch-wrapper').clientWidth + MW;
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