class Field {
    constructor(tag, colour, radius, x, y, interference=[]) {
        this.tag = tag;
        this.colour = colour;
        this.radius = radius;
        this.peak = 1;
        this.x = x;
        this.y = y;
        this.interference = interference;
        this.data = {};
        this._emit();
        this.displayed = false;
        var multi = 4.761
    }

    at(x, y) {
        if (x in this.data && y in this.data[x]) return this.data[x][y];
        if (x > radius || y > radius) return 0;
        if (!(x in this.data)) this.data[x] = {};

        var r = Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)
        var stdev = Math.pow(this.radius / multi, 2)
        var f = this.peak * Math.exp(Math.pow(-stdev, -1) * r)
        this.interference.forEach(function(element) {
            stdev = Math.pow(element[0] / multi, 2)
            f -= element[1] * Math.exp(Math.pow(-stdev, -1) * r)
        }, this);
        this.data[x][y] = f;
        return f;
    };

    _emit() {
        for (let x = this.x - this.radius; x < this.x + this.radius; x++) {
            for (let y = this.y - this.radius; y < this.y + this.radius; y++) {
                this.at(x, y);
            }
        }
    }
}

class Location {
    constructor(x, y, colour) {
        this.x = x;
        this.y = y;
        this.colour = colour;
        this.fields = []
    }

    addField(tag, colour, radius, interference=[]) {
        var field = new Field(tag, colour, radius, this.x, this.y, interference);
        this.fields.push(field)
        return this.fields[this.fields.length -1];
    }

    numFields() {
        return this.fields.length
    }
}