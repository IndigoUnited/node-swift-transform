'use strict';

var TransformStream = require('stream').Transform;
var ReadableStream = require('stream').Readable;
var expect = require('expect.js');
var createSwiftStream = require('./util/createSwiftStream');
var swiftTransform = require('../index');

describe('SwiftTransform', function () {
    describe('drop-in replacement', function () {
        it('should call _transform & _flush', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var flushCalls = 0;
            var transformCalls = 0;
            var bufferedData = [];

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback(null, { wrap: data });
                    }, 10);
                },
                flush: function (callback) {
                    flushCalls += 1;
                    setTimeout(callback, 10);
                }
            }, { objectMode: true });

            tstream
            .on('data', function (data) {
                bufferedData.push(data);
            })
            .on('end', function () {
                expect(bufferedData[0]).to.eql({ wrap: { nr: 1 } });
                expect(bufferedData[1]).to.eql({ wrap: { nr: 2 } });
                expect(bufferedData[2]).to.eql({ wrap: { nr: 3 } });

                expect(transformCalls).to.be(3);
                expect(flushCalls).to.be(1);

                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should work without _flush', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var transformCalls = 0;
            var bufferedData = [];

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback(null, { wrap: data });
                    }, 10);
                }
            }, { objectMode: true });

            tstream
            .on('data', function (data) {
                bufferedData.push(data);
            })
            .on('end', function () {
                expect(bufferedData[0]).to.eql({ wrap: { nr: 1 } });
                expect(bufferedData[1]).to.eql({ wrap: { nr: 2 } });
                expect(bufferedData[2]).to.eql({ wrap: { nr: 3 } });

                expect(transformCalls).to.be(3);

                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should wait for _transform', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var transformCalls = 0;
            var bufferedData = [];
            var time = Date.now();

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback(null, data);
                    }, data.nr * 100);
                }
            }, { objectMode: true });

            tstream
            .on('data', function (data) {
                bufferedData.push(data);
            })
            .on('end', function () {
                expect(bufferedData[0]).to.eql({ nr: 1 });
                expect(bufferedData[1]).to.eql({ nr: 2 });
                expect(bufferedData[2]).to.eql({ nr: 3 });

                expect(transformCalls).to.be(3);
                expect(Date.now() - time).to.be.above(599);

                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should wait for _flush', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var time = Date.now();

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    setTimeout(function () {
                        callback(null, data);
                    }, 10);
                },
                flush: function (callback) {
                    setTimeout(callback, 600);
                }
            }, { objectMode: true });

            tstream
            .on('data', function () {})
            .on('end', function () {
                expect(Date.now() - time).to.be.above(599);
                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should emit "error" if _transform failed', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var flushCalls = 0;
            var transformCalls = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback(new Error('foo'));
                    }, 10);
                },
                flush: function (callback) {
                    flushCalls += 1;
                    callback();
                }
            }, { objectMode: true });

            tstream
            .on('data', function () {
                next(new Error('Should have not emitted any data'));
            })
            .on('end', function () {
                next(new Error('Should have not emitted end'));
            })
            .on('error', function (err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('foo');

                expect(transformCalls).to.be(1);
                expect(flushCalls).to.be(0);

                setTimeout(next, 300);
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should emit "error" if _flush failed', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var flushCalls = 0;
            var transformCalls = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback(null, data);
                    }, 10);
                },
                flush: function (callback) {
                    flushCalls += 1;
                    callback(new Error('foo'));
                }
            }, { objectMode: true });

            tstream
            .on('data', function () {})
            .on('end', function () {
                next(new Error('Should have not emitted end'));
            })
            .on('error', function (err) {
                expect(err).to.be.an(Error);
                expect(err.message).to.be('foo');

                expect(transformCalls).to.be(3);
                expect(flushCalls).to.be(1);

                setTimeout(next, 300);
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should call _transform and _flush with the correct context', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var flushCalls = 0;
            var transformCalls = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    expect(this).to.be(tstream);

                    setTimeout(function () {
                        callback(null, data);
                    }, 10);
                },
                flush: function (callback) {
                    flushCalls += 1;
                    expect(this).to.be(tstream);

                    setTimeout(callback, 10);
                }
            }, { objectMode: true });

            tstream
            .on('data', function () {})
            .on('end', function () {
                expect(transformCalls).to.be(1);
                expect(flushCalls).to.be(1);

                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push(null);
        });

        it('should not push data if null', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var flushCalls = 0;
            var transformCalls = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    setTimeout(function () {
                        callback();
                    }, 10);
                },
                flush: function (callback) {
                    flushCalls += 1;
                    setTimeout(callback, 10);
                }
            }, { objectMode: true });

            tstream
            .on('data', function () {
                next(new Error('Should not emit data'));
            })
            .on('end', function () {
                expect(transformCalls).to.be(2);
                expect(flushCalls).to.be(1);

                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push(null);
        });
    });

    describe('concurrency', function () {
        it('should run transforms in parallel according to the concurrency', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var transformCalls = 0;
            var inflightTransforms = 0;
            var time = Date.now();

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    inflightTransforms += 1;

                    expect(inflightTransforms <= 3).to.be(true);

                    setTimeout(function () {
                        inflightTransforms -= 1;
                        callback(null, data);
                    }, data.nr * 100);
                }
            }, { objectMode: true, concurrency: 3 });

            tstream
            .on('data', function () {})
            .on('end', function () {
                expect(transformCalls).to.be(10);
                expect(Date.now() - time).to.be.below(1000);
                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push({ nr: 3 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 1 });
            rstream.push({ nr: 5 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push({ nr: 1 });
            rstream.push(null);
        });

        it('should kill the queue if one of the transform fails', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var transformCalls = 0;
            var inflightTransforms = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    inflightTransforms += 1;

                    expect(inflightTransforms <= 3).to.be(true);

                    setTimeout(function () {
                        inflightTransforms -= 1;

                        if (data.nr === 3) {
                            callback(new Error('foo'));
                        } else {
                            callback(null, data);
                        }
                    }, data.nr * 100);
                }
            }, { objectMode: true, concurrency: 3 });

            tstream
            .on('data', function () {})
            .on('end', function () {
                next(new Error('Should have not emitted end'));
            })
            .on('error', function () {
                expect(transformCalls).to.be(5);

                setTimeout(next, 1000);
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push({ nr: 4 });
            rstream.push({ nr: 5 });
            rstream.push({ nr: 6 });
            rstream.push({ nr: 7 });
            rstream.push(null);
        });

        it('should not emit any more data if one of the transform fails', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var transformCalls = 0;
            var inflightTransforms = 0;
            var bufferedData = [];

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    transformCalls += 1;
                    inflightTransforms += 1;

                    expect(inflightTransforms <= 3).to.be(true);

                    setTimeout(function () {
                        inflightTransforms -= 1;

                        if (data.nr === 3) {
                            callback(new Error('foo'));
                        } else {
                            callback(null, data);
                        }
                    }, data.nr * 100);
                }
            }, { objectMode: true, concurrency: 3 });

            tstream
            .on('data', function (data) {
                bufferedData.push(data);
            })
            .on('end', function () {
                next(new Error('Should have not emitted end'));
            })
            .on('error', function () {
                expect(transformCalls).to.be(5);
                expect(bufferedData).to.eql([
                    { nr: 1 },
                    { nr: 2 }
                ]);

                setTimeout(next, 1000);
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push({ nr: 4 });
            rstream.push({ nr: 5 });
            rstream.push({ nr: 6 });
            rstream.push({ nr: 7 });
            rstream.push(null);
        });

        it('flush should wait for all transforms to end', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var inflightTransforms = 0;

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    inflightTransforms += 1;

                    expect(inflightTransforms <= 3).to.be(true);

                    setTimeout(function () {
                        inflightTransforms -= 1;
                        callback(null, data);
                    }, data.nr * 100);
                }
            }, { objectMode: true, concurrency: 3 });

            tstream
            .on('data', function () {})
            .on('end', function () {
                expect(inflightTransforms).to.be(0);
                next();
            });

            rstream.pipe(tstream);
            rstream.push({ nr: 1 });
            rstream.push({ nr: 2 });
            rstream.push({ nr: 3 });
            rstream.push(null);
        });

        it('should work for a considerable amount of work', function (next) {
            var tstream;
            var rstream = new ReadableStream({ objectMode: true });
            var inflightTransforms = 0;
            var x;
            var bufferedData = [];

            tstream = createSwiftStream({
                transform: function (data, encoding, callback) {
                    inflightTransforms += 1;

                    expect(inflightTransforms <= 15).to.be(true);

                    setTimeout(function () {
                        inflightTransforms -= 1;
                        callback(null, data);
                    }, data.nr);
                }
            }, { objectMode: true, concurrency: 15 });

            tstream
            .on('data', function (data) {
                bufferedData.push(data);
            })
            .on('end', function () {
                expect(bufferedData.length).to.be(100);
                expect(inflightTransforms).to.be(0);
                next();
            });

            rstream.pipe(tstream);

            for (x = 0; x < 100; x += 1) {
                rstream.push({ nr: Math.floor(Math.random() * 1000) });
            }

            rstream.push(null);
        });
    });

    describe('modify', function () {
        it('should not modify twice', function () {
            var stream = new TransformStream();
            var swift;

            stream._transform = function (data, encoding, callback) {
                callback(data);
            };

            swiftTransform(stream, 10);

            swift = stream._swiftTransform;
            expect(swift).to.be.ok();

            swiftTransform(stream, 10);
            expect(stream._swiftTransform).to.be(swift);
        });
    });
});
