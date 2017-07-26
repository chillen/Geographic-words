var controller = (function (m) {

  // PUBLIC
  function initialize (sketch, model, view) {
    m.model = model
    m.view = view
    m.sketch = sketch
    m.dom = domController
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

  function addPoint () {
    let x = m.dom.get('x')
    let y = m.dom.get('y')
    let radius = m.dom.get('radius')
    let name = m.dom.get('name')
    m.model.addPoint(x, y, radius, name)
    m.dom.displayMainForm()
    m.dom.clearNewPointForm()
  }

  function cancelAddPoint () {
    m.dom.displayMainForm()
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

    s.mouseClicked = function () {
      if (!s.keyIsDown(s.CONTROL)) return
      let offset = m.view.getOffset()
      let loc = { x: Math.round(s.mouseX - offset.x), y: Math.round(s.mouseY - offset.y) }
      m.dom.displayNewPointForm()
      m.dom.set('x', loc.x).set('y', loc.y)
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

  return {
    draw: draw,
    initialize: initialize,
    swapMap: swapMap,
    addPoint: addPoint,
    cancelAddPoint: cancelAddPoint
  }
})({})