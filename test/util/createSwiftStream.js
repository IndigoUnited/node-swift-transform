'use strict';

var util                 = require('util');
var swiftTransform       = require('../../index');
var SwiftTransformStream = swiftTransform.Transform;

function createSwiftStream(methods, options) {
    function Stream(options) {
        SwiftTransformStream.call(this, options);
    }

    util.inherits(Stream, SwiftTransformStream);

    Stream.prototype._transform = methods.transform;
    Stream.prototype._flush = methods.flush;

    return new Stream(options);
}

module.exports = createSwiftStream;
