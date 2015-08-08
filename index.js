'use strict';

var util            = require('util');
var TransformStream = require('stream').Transform;
var async           = require('async');

function SwiftTransformStream(options) {
    TransformStream.call(this, options);

    modify(this, options && options.concurrency);
}

util.inherits(SwiftTransformStream, TransformStream);

// -------------------------------------------

function transform(data, encoding, callback) {
    /* jshint validthis:true */

    // Ignore if killed
    /* istanbul ignore if */
    if (this._killed) {
        return;
    }

    // Push the task
    this._swiftQueue.push({ data: data, encoding: encoding }, transformDone.bind(this));

    // If we are not saturated, simply call more right away
    if (this._swiftQueue.running() + this._swiftQueue.length() < this._swiftQueue.concurrency) {
        setImmediate(callback);
    // Otherwise store the callback because we will need it later
    } else {
        this._callback = callback;
    }
}

function flush(callback) {
    /* jshint validthis:true */
    var _flush = this.__flush || function (callback) { callback(); };

    // Ignore if killed
    /* istanbul ignore if */
    if (this._killed) {
        return;
    }

    if (this._swiftQueue.idle()) {
        return _flush.call(this, callback);
    }

    this._swiftQueue.drain = function () {
        _flush.call(this, callback);
    }.bind(this);
}

function doTransform(task, callback) {
    /*jshint validthis:true*/
    this.__transform.call(this, task.data, task.encoding, callback);
}

function transformDone(err, data) {
    /*jshint validthis:true*/
    var callback;

    // Ignore if killed
    if (this._killed) {
        return;
    }

    // If the transform failed, emit error and kill the queue
    if (err) {
        this._killed = true;
        this._callback = null;
        this._swiftQueue.kill();
        this.emit('error', err);
    // Otherwise push the data and call callback to keep data flowing
    } else {
        data != null && this.push(data);

        if (this._callback) {
            callback = this._callback;
            this._callback = null;
            callback();
        }
    }
}

function modify(stream, concurrency) {
    if (stream._swiftQueue) {
        return stream;
    }

    // Copy user transform to private methods & replace with ours
    stream.__transform = stream._transform;
    stream._transform = transform;
    stream.__flush = stream._flush;
    stream._flush = flush;

    // Queue setup
    stream._swiftQueue = async.queue(doTransform.bind(stream), concurrency || 1);

    return stream;
}

module.exports = modify;
module.exports.Transform = SwiftTransformStream;
