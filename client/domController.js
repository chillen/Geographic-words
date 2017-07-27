var domController = (function (m) {

  m.sidebar = document.querySelector('.menu')
  m.main = m.sidebar.querySelector('.call-to-action')
  m.newpoint = m.sidebar.querySelector('.new-point-form')
  m.x = m.newpoint.querySelector('#newpointX')
  m.y = m.newpoint.querySelector('#newpointY')
  m.radius = m.newpoint.querySelector('#newpointRadius')
  m.name = m.newpoint.querySelector('#newpointName')

  m.getSize = function () {
    return {
      width: document.querySelector('#sketch').clientWidth,
      height: document.querySelector('#sketch').clientHeight
    }
  }

  m.toggleTextSelection = function () {
    if (document.body.classList.contains('noselect')) {
      document.body.classList.remove('noselect')
    } else {
      document.body.classList.add('noselect')
    }
  }

  m.get = function (attr) {
    switch (attr) {
      case 'x':
        return getX()
      case 'y':
        return getY()
      case 'radius':
        return getRadius()
      case 'name':
        return getName()
    }
  }

  m.set = function (attr, val) {
    switch (attr) {
      case 'x':
        return setX(val)
      case 'y':
        return setY(val)
      case 'radius':
        return setRadius(val)
      case 'name':
        return setName(val)
    }
  }

  m.displayNewPointForm = function () {
    m.clearNewPointForm()
    m.main.style.display = 'none'
    m.newpoint.style.display = 'block'
  }

  m.displayMainForm = function () {
    m.main.style.display = 'block'
    m.newpoint.style.display = 'none'
    m.clearNewPointForm()
  }

  m.clearNewPointForm = function () {
    setX('')
    setY('')
    setName('')
    setRadius('')
  }

  let getX = function () {
    return parseInt(m.x.value)
  }

  let getY = function () {
    return parseInt(m.y.value)
  }

  let getRadius = function () {
    return parseInt(m.radius.value)
  }

  let getName = function () {
    return m.name.value
  }

  let setX = function (val) {
    m.x.setAttribute('value', val)
    checkDirty()
    return m
  }

  let setY = function (val) {
    m.y.setAttribute('value', val)
    checkDirty()
    return m
  }

  let setRadius = function (val) {
    m.radius.setAttribute('value', val)
    checkDirty()
    return m
  }

  let setName = function (val) {
    m.name.setAttribute('value', val)
    checkDirty()
    return m
  }

  let checkDirty = function () {
    var inputs = document.querySelectorAll('.mdl-textfield')
    inputs.forEach(d => d.MaterialTextfield.checkDirty())
  }

  return m
})({})
