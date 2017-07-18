// TODO: Take the log instead of weird power series
// TODO: Make map getter which avoids storing full sparce
// TODO: Use bower for dependencies
class Field {
    constructor(tag, colour, radius, peak, x, y, interference=[]) {
        this.tag = tag;
        this.colour = colour;
        this.radius = radius;
        this.peak = peak;
        this.x = x;
        this.y = y;
        this.interference = interference;
        this.data = null
    }

    fieldAt(x, y) {
        var r = Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)
        var stdev = Math.pow(this.radius / 4.761, 2)
        var f = this.peak * Math.exp(Math.pow(-stdev, -1) * r)
        this.interference.forEach(function(element) {
            stdev = Math.pow(element[0] / 4.761, 2)
            f -= element[1] * Math.exp(Math.pow(-stdev, -1) * r)
        }, this);
        return f;
    };

    emit(width, height) {
        var temp = Field.sparseMap(width, height);
        var that = this;
        this.data = []
        temp.forEach(function(e) {
            that.data.push([]);
            temp[0].forEach(function(c) {
                that.data[that.data.length-1].push(0);
            });
        });
        for (var x = Math.max(0, this.x - this.radius); x < Math.min(width, this.x + this.radius); x++) {
            for (var y = Math.max(0, this.y - this.radius); y < Math.min(height, this.y + this.radius); y++) {
                this.data[x][y] = Math.min(this.fieldAt(x, y), 255);
            }
        }
        return this.data;
    };


     static sparseMap(width, height) {
        var out = [];
        for (var row = 0; row < width; row++) {
            out.push([]);
            for (var col = 0; col < height; col++) {
                out[row].push(0);
            }
        }
        return out;
    };
   
}

class Location {
    constructor(x, y, colour) {
        this.x = x;
        this.y = y;
        this.colour = colour;
        this.fields = []
    }

    addField(tag, colour, radius, peak, interference=[]) {
        var field = new Field(tag, colour, radius, peak, this.x, this.y, interference);
        this.fields.push(field)
        return this.fields[this.fields.length -1];
    }

    numFields() {
        return this.fields.length
    }
}