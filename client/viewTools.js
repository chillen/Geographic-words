var viewTools = (function (m) {
  m.maps = []
  m.sketch = null
  m.mapImages = {loaded: false}
  m.scenes = {}
  m.mapDetails = { hex: { width: 46.5, hMargin: 35, wMargin: 23.25 }, height: 2048, width: 2048 }
  m.mapOffset = {x: 0, y: 0}
  m.resizeTimeout = null
  m.graphSize = {width: 400, height: 200}

  // PUBLIC
  function initialize (sketch, maps) {
    m.maps = maps
    m.sketch = sketch
    loadMaps(maps)
      .then(maps => (m.mapImages = maps))
      .then(setupScenes)
  }

  function drawMap (map) {
    m.sketch.background([0, 0, 0, 255])
    if (!m.mapImages.loaded) {
      m.sketch.fill([255, 255, 255, 255])
      m.sketch.textSize(64)
      m.sketch.textAlign(m.sketch.CENTER)
      m.sketch.text('Loading...', m.sketch.width / 2, 100)
      return
  }

    m.sketch.image(m.mapImages[map], m.mapOffset.x, m.mapOffset.y)
  }

  function increaseOffset (x, y) {
    m.mapOffset.x += x
    m.mapOffset.y += y
  }

  function drawPoints (points) {
    if (!m.scenes.hasOwnProperty('points') || m.scenes['points'] === null) {
      return
    }
    m.scenes['points'].ellipseMode(m.sketch.CENTER)
    m.scenes['points'].noStroke()
    for (let point of points) {
      m.scenes['points'].fill(point.colour)
      m.scenes['points'].ellipse(point.x, point.y, 20, 20)
    }
    m.sketch.image(m.scenes['points'], m.mapOffset.x, m.mapOffset.y)
  }

  function drawFields (fields) {
    if (!m.scenes.hasOwnProperty('fields') || m.scenes['fields'] === null) {
      return
    }
    // Don't load the pixels if it isn't necessary
    let loaded = false
    for (let field of fields) {
      if (field.displayed) {
        continue
      }
      if (!loaded) {
        loaded = true
        m.scenes['fields'].loadPixels()
      }
      for (let x in field.data) {
        for (let y in field.data[x]) {
          let pos = Math.ceil(x) * 4 + Math.ceil(y) * 4 * m.scenes['fields'].width
          m.scenes['fields'].pixels[pos] += (field.colour[0]) * (field.at(x, y) / 1)
          m.scenes['fields'].pixels[pos + 1] += (field.colour[1]) * (field.at(x, y) / 1)
          m.scenes['fields'].pixels[pos + 2] += (field.colour[2]) * (field.at(x, y) / 1)
          m.scenes['fields'].pixels[pos + 3] += 255 * (field.at(x, y) / 1)
          field.displayed = true
        }
      }
    }
    if (loaded === true) {
      m.scenes['fields'].updatePixels()
    }
    m.sketch.image(m.scenes['fields'], m.mapOffset.x, m.mapOffset.y)
  }

  function drawGraph (points, fields, datapoints = []) {
    if (!m.scenes.hasOwnProperty('graph') || m.scenes['graph'] === null) {
      return
    }
    let opacity = 100
    m.scenes['graph'].clear()
    m.scenes['graph'].background([0, 0, 0, opacity])
    drawGrid(m.scenes['graph'])

    if (datapoints.length > 0) {
      drawGraphData(datapoints, fields)
    }

    m.sketch.image(m.scenes['graph'], m.sketch.width - m.graphSize.width, m.sketch.height - m.graphSize.height)

    function drawGrid (scene) {
      scene.stroke([40, 40, 40, opacity])
      scene.strokeWeight(1)
      for (let i = 0; i < Math.max(scene.height, scene.width); i += 10) {
        scene.line(0, i, scene.width, i)
        scene.line(i, 0, i, scene.height)
      }
    }
  }

  function drawClicks (points) {
    let length = 5
    for (let point of points) {
      m.sketch.strokeWeight(1)
      m.sketch.stroke(0)
      m.sketch.line(point.x - length, point.y, point.x + length, point.y)
      m.sketch.line(point.x, point.y - length, point.x, point.y + length)
    }

    if (points.length === 2) {
      m.sketch.stroke(200, 200, 200)
      m.sketch.line(points[0].x, points[0].y, points[1].x, points[1].y)
    }
  }

  function drawGraphData (points, fields) {
    points = points.map(point => {
      return {
        x: point.x - Math.round(m.mapOffset.x),
        y: point.y - Math.round(m.mapOffset.y)
      }
    })

    for (let field of fields) {
      let fieldPoints = points.map((point, index) => {
        return {
          x: index,
          y: m.sketch.map(field.at(point.x, point.y), 0, 1, m.scenes['graph'].height, 0)
        }
      })

      m.scenes['graph'].stroke(field.colour)
      m.scenes['graph'].strokeWeight(2)
      m.scenes['graph'].noFill()
      m.scenes['graph'].beginShape()
      m.scenes['graph'].curveVertex(fieldPoints[0].x, fieldPoints[0].y)
      for (let point of fieldPoints) {
        m.scenes['graph'].curveVertex(point.x, point.y)
      }
      m.scenes['graph'].curveVertex(fieldPoints[fieldPoints.length - 1].x, fieldPoints[fieldPoints.length - 1].y)
      m.scenes['graph'].endShape()
    }
  }

  // PRIVATE

  function loadImage (filepath) {
    return new Promise(function (resolve, reject) {
      resolve(m.sketch.loadImage(filepath, resolve))
    })
  }

  function loadMaps (maps) {
    let result = {}
    let prefix = 'data/'
    let suffix = 'Map.png'

    return new Promise(function (resolve, reject) {
      for (let map of maps) {
        loadImage(prefix + map + suffix)
          .then(image => (result[map] = image))
      }
      result['loaded'] = true
      resolve(result)
    })
  }

  function setupScenes () {
    m.sketch.resizeCanvas(400, 400)
    m.scenes['points'] = m.sketch.createGraphics(m.mapDetails.width, m.mapDetails.height)
    m.scenes['fields'] = m.sketch.createGraphics(m.mapDetails.width, m.mapDetails.height)
    m.scenes['interactions'] = m.sketch.createGraphics(m.mapDetails.width, m.mapDetails.height)
    m.scenes['graph'] = m.sketch.createGraphics(m.graphSize.width, m.graphSize.height)
  }

  // var clickpoints = []
  // var mapImages = {}
  // var easing = 0.1
  // var m.mapDetails = { hex: { width: 46.5, hMargin: 35, wMargin: 23.25 }, height: 2048, width: 2048 }
  return {
    initialize: initialize,
    drawMap: drawMap,
    drawPoints: drawPoints,
    drawFields: drawFields,
    drawGraph: drawGraph,
    drawGraphData: drawGraphData,
    drawClicks: drawClicks,
    increaseOffset: increaseOffset
  }
})({})
