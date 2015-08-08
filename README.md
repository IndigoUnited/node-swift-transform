# swift-transform [![Build Status](https://travis-ci.org/IndigoUnited/node-swift-transform.svg?branch=master)](https://travis-ci.org/IndigoUnited/node-swift-transform) [![Coverage Status](https://coveralls.io/repos/IndigoUnited/node-swift-transform/badge.png?branch=master)](https://coveralls.io/r/IndigoUnited/node-swift-transform?branch=master)

Parallelized transform streams for everyone!

**NOTE**: Order is not guaranteed!


## Installation

`$ npm install swift-transform`


## Usage

The swift transform stream is a drop-in replacement to nodejs `TransformStream` and adds a `concurrency` option that allows you to control the number of concurrent transformations.

```js
var SwiftTransformStream = require('swift-transform').Transform;

function MyTransformStream() {
    SwiftTransformStream.call(this, { objectMode: true, concurrency: 5 });
}

util.inherits(MyTransformStream, SwiftTransformStream);

// ------------------------------------

MyTransformStream.prototype._transform = function (data, encoding, callback) {
    // ..
};

MyTransformStream.prototype._flush = function (callback) {
    // ..
};

module.exports = MyTransformStream;
```

In cases you have a transform stream which you do not own but want to parallelize it:

```js
var swiftTransform = require('swift-transform');

readableStream
.pipe(swiftTransform(transformStream, 10))
.pipe(writableStream);
```


## Tests

`$ npm test`


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
