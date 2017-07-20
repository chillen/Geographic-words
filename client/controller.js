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