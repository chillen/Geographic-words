// ES6 Importing Modules can't come sooner

var init = (function() {
    var maps = ["biome", "height", "moisture"];

    function _loadImage(filepath) {
        return new Promise(function(resolve, reject) {
            resolve(loadImage(filepath, resolve));
        });
    };

    function _timeout(time) {
        return new Promise(function(resolve, reject) {
            setTimeout(resolve, time);
        });
    }

    function loadMaps() {
        let result = {};
        let prefix = "data/";
        let suffix = "Map.png";

        return new Promise(function(resolve, reject) {
            for (let map of maps) {
                _loadImage(prefix + map + suffix)
                    .then(image => result[map] = image);
            }
            resolve(result);
        });
    }

    function loadPoints() {
        let points = [];
        points.push(new Location(766, 708, [200, 150, 50, 255]));
        points[points.length-1].addField("test", [200, 200, 0, 255], 300);
        points.push(new Location(625, 500, [200, 150, 50, 255]));
        points[points.length-1].addField("test", [200, 0, 0, 255], 300);

        return new Promise(function(resolve, reject) {
            resolve(points);
        })
    }

    return { loadMaps: loadMaps, loadPoints: loadPoints }
})();