# swift-transform

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/swift-transform
[downloads-image]:http://img.shields.io/npm/dm/swift-transform.svg
[npm-image]:http://img.shields.io/npm/v/swift-transform.svg
[travis-url]:https://travis-ci.org/IndigoUnited/node-swift-transform
[travis-image]:http://img.shields.io/travis/IndigoUnited/node-swift-transform.svg
[coveralls-url]:https://coveralls.io/r/IndigoUnited/node-swift-transform
[coveralls-image]:https://img.shields.io/coveralls/IndigoUnited/node-swift-transform.svg
[david-dm-url]:https://david-dm.org/IndigoUnited/node-swift-transform
[david-dm-image]:https://img.shields.io/david/IndigoUnited/node-swift-transform.svg
[david-dm-dev-url]:https://david-dm.org/IndigoUnited/node-swift-transform#info=devDependencies
[david-dm-dev-image]:https://img.shields.io/david/dev/IndigoUnited/node-swift-transform.svg

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
