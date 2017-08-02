var modelData = (function () {
  var points = []
  function initialize () {
    points.push(new Location(766, 708, [200, 150, 50, 255]))
    points[points.length - 1].addField('pride', [200, 200, 0, 255], 600)
    points.push(new Location(625, 500, [200, 150, 50, 255]))
    points[points.length - 1].addField('dracula', [200, 0, 0, 255], 600)
  }

  function getPoints () {
    return points
  }

  function getFields () {
    let fields = []
    for (let point of points) {
      for (let field of point.fields) {
        fields.push(field)
      }
    }
    return fields
  }

  function addPoint (x, y, radius, name, colour = [200, 200, 150, 255]) {
    let point = new Location(x, y, colour)
    point.addField(name, colour, radius)
    points.push(point)
  }

  return {
    initialize: initialize,
    getPoints: getPoints,
    getFields: getFields,
    addPoint: addPoint
  }
})()
