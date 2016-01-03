'use strict';

var util = require('util');
var TransformStream = require('stream').Transform;
var async = require('async');

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
    if (this._swiftTransform.killed) {
        return;
    }

    // Push the task
    this._swiftTransform.queue.push({ data: data, encoding: encoding }, transformDone.bind(this));

    // If we are not saturated, simply call more right away
    if (this._swiftTransform.queue.running() + this._swiftTransform.queue.length() < this._swiftTransform.queue.concurrency) {
        setImmediate(callback);
    // Otherwise store the callback because we will need it later
    } else {
        this._swiftTransform.callback = callback;
    }
}

function flush(callback) {
    /* jshint validthis:true */
    var _flush = this._swiftTransform.flush || function (callback) { callback(); };

    // Ignore if killed
    /* istanbul ignore if */
    if (this._swiftTransform.killed) {
        return;
    }

    if (this._swiftTransform.queue.idle()) {
        return _flush.call(this, callback);
    }

    this._swiftTransform.queue.drain = _flush.bind(this, callback);
}

function doTransform(task, callback) {
    /*jshint validthis:true*/
    this._swiftTransform.transform.call(this, task.data, task.encoding, callback);
}

function transformDone(err, data) {
    /*jshint validthis:true*/
    var callback;

    // Ignore if killed
    if (this._swiftTransform.killed) {
        return;
    }

    // If the transform failed, emit error and kill the queue
    if (err) {
        this._swiftTransform.killed = true;
        this._swiftTransform.callback = null;
        this._swiftTransform.queue.kill();
        this.emit('error', err);
    // Otherwise push the data and call callback to keep data flowing
    } else {
        data != null && this.push(data);

        if (this._swiftTransform.callback) {
            callback = this._swiftTransform.callback;
            this._swiftTransform.callback = null;
            callback();
        }
    }
}

function modify(stream, concurrency) {
    if (stream._swiftTransform) {
        return stream;
    }

    stream._swiftTransform = {};

    // Copy user transform & flush methods and replace with ours
    stream._swiftTransform.transform = stream._transform;
    stream._swiftTransform.flush = stream._flush;
    stream._transform = transform;
    stream._flush = flush;

    // Queue setup
    stream._swiftTransform.queue = async.queue(doTransform.bind(stream), concurrency || 1);

    return stream;
}

module.exports = modify;
module.exports.Transform = SwiftTransformStream;
