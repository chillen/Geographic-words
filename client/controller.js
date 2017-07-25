var controller = (function (m) {

  // PUBLIC
  function initialize (sketch, model, view) {
    m.model = model
    m.view = view
    m.sketch = sketch
    m.activeMap = 'biome'
    m.clicks = []
    m.dragging = false
    m.easing = 0.1
    setupEvents(sketch)
    window.dispatchEvent(new Event('resize'))
  }

  function draw () {
    let points = m.model.getPoints()
    let fields = m.model.getFields()
    changeOffset(m.dragging)
    m.view.drawMap(m.activeMap)
    m.view.drawFields(fields)
    m.view.drawPoints(points)
    m.view.drawClicks(m.clicks)
    if (m.clicks.length === 2) {
      let linepoints = pointsBetween(m.clicks)
      m.view.drawGraph(points, fields, linepoints)
    } else {
      m.view.drawGraph(points, fields)
    }
  }

  function swapMap (map) {
    m.activeMap = map
  }

  // PRIVATE

  function pointsBetween (points) {
    function roundPoint (p) {
      return {x: Math.round(p.x), y: Math.round(p.y)}
    }
    function diagDist (points) {
      let dx = points[0].x - points[1].x
      let dy = points[0].y - points[1].y
      return Math.max(Math.abs(dx), Math.abs(dy))
    }
    function lerp (s, e, t) {
      return s + t * (e - s)
    }
    function lerpPoints (points, t) {
      return {x: lerp(points[0].x, points[1].x, t), y: lerp(points[0].y, points[1].y, t)}
    }
    let N = diagDist(points)
    let linePoints = []

    for (var i = 0; i < N; i++) {
      let t = i / N
      linePoints.push(roundPoint(lerpPoints(points, t)))
    }

    return linePoints
  }

  function setupEvents (s) {
    s.windowResized = function () {
      clearTimeout(m.resizeTimeout)
      m.resizeTimeout = setTimeout(function () {
        let size = getTargetCanvasSize()
        m.sketch.resizeCanvas(size.width, size.height)
      }, 200)
    }

    s.mousePressed = function () {
      // Keep within bounds
      if (s.mouseX > s.width || s.mouseY > s.height || s.mouseX < 0 || s.mouseY < 0) {
        return
      }
      let x = s.mouseX
      let y = s.mouseY

      if (s.mouseButton === s.LEFT) {
        m.clicks = [{x: x, y: y}]
        if (!s.keyIsDown(s.SHIFT)) {
          m.clicks.push({x: x, y: y})
        }
      }
    }

    s.mouseDragged = function () {
      if ((m.dragging = s.keyIsDown(s.SHIFT))) {
        return
      }
      if (s.mouseX > s.width || s.mouseY > s.height || s.mouseX < 0 || s.mouseY < 0) {
        return
      }
      if (m.clicks.length === 2) {
        m.clicks[1] = {x: s.mouseX, y: s.mouseY}
      }
    }
  }

  function changeOffset (dragging) {
    if (!dragging) {
      return
    }

    if (!m.sketch.mouseIsPressed) {
      return (dragging = false)
    }

    let xchange = m.sketch.mouseX - m.clicks[0].x
    let ychange = m.sketch.mouseY - m.clicks[0].y

    xchange *= m.easing
    ychange *= m.easing

    m.view.increaseOffset(xchange, ychange)
  }

  function getTargetCanvasSize () {
    let H = document.getElementById('sketch-wrapper').clientHeight
    let W = document.getElementById('sketch-wrapper').clientWidth

    // Just in case of weird timing issues
    H = H > 0 ? H : 1
    W = W > 0 ? W : 1

    return { height: H, width: W }
  }

  return { draw: draw, initialize: initialize, swapMap: swapMap }
})({})

// function mouseClicked() {
//     if (!keyIsDown(CONTROL)) return;

//     var loc = { x: Math.round(mouseX - mapOffset.x), y: Math.round(mouseY - mapOffset.y) };
//     var sidebar = document.querySelector('#menu');
//     var main = sidebar.querySelector("#main-view");
//     var newpoint = sidebar.querySelector(".new-point-form");
//     newpoint.querySelector("#x").setAttribute("value", loc.x);
//     newpoint.querySelector("#y").setAttribute("value", loc.y);
//     main.style.display = "none";
//     newpoint.style.display = "block";
//     var inputs = document.querySelectorAll('.mdl-textfield');
//     inputs.forEach(d => d.MaterialTextfield.checkDirty());
// }

// function addPoint() {
//     var sidebar = document.querySelector('#menu');
//     var main = sidebar.querySelector("#main-view");
//     var newpoint = sidebar.querySelector(".new-point-form");
//     var x = parseInt(newpoint.querySelector("#x").value);
//     var y = parseInt(newpoint.querySelector("#y").value);
//     var name = newpoint.querySelector("#name").value;
//     var radius = parseInt(newpoint.querySelector("#radius").value);
//     newpoint.style.display = "none";
//     points.push(new Location(x, y, [200, 150, 100, 255]));
//     selected = points[points.length - 1];
//     points[points.length - 1].addField(name, [200, 150, 100, 255], radius);
//     displaySelected(points[points.length - 1]);
// }

// function displaySelected(p) {
//     var sidebar = document.querySelector('#menu');
//     var main = sidebar.querySelector("#main-view");
//     var newpoint = sidebar.querySelector(".point-information");
//     var name = newpoint.querySelector("#name");
//     var coords = newpoint.querySelector("#coords");
//     newpoint.style.display = "block";
//     name.innerHTML = p.name;
//     coords.innerHTML = "(" + p.x + ", " + p.y + ")";
// }

// function cancelAddPoint() {
//     var sidebar = document.querySelector('#menu');
//     var main = sidebar.querySelector("#main-view");
//     var selected = sidebar.querySelector(".point-information");
//     var newpoint = sidebar.querySelector(".new-point-form");
//     main.style.display = "block";
//     newpoint.style.display = "none";
//     selected.style.display = "none";
// }
