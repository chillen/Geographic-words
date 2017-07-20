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

    return { loadMaps: loadMaps }
})();