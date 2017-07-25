var maps = ['biome', 'height', 'moisture']

var p5js = new p5(function (sketch) {
  var model = modelData
  var view = viewTools
  var ctrl = controller

  sketch.setup = function () {
    model.initialize()
    view.initialize(sketch, maps)
    ctrl.initialize(sketch, model, view)
  }

  sketch.draw = ctrl.draw
}, 'sketch')
