var test = require('tap').test
var inf = require('./inflight.js')


function req (key, cb) {
  cb = inf(key, cb)
  if (cb) setTimeout(function () {
    cb(key)
    cb(key)
  })
  return cb
}

test('basic', function (t) {
  var calleda = false
  var a = req('key', function (k) {
    t.notOk(calleda)
    calleda = true
    t.equal(k, 'key')
    if (calledb) t.end()
  })
  t.ok(a, 'first returned cb function')

  var calledb = false
  var b = req('key', function (k) {
    t.notOk(calledb)
    calledb = true
    t.equal(k, 'key')
    if (calleda) t.end()
  })

  t.notOk(b, 'second should get falsey inflight response')
})

test('timing', function (t) {
  var expect = [
    'method one',
    'start one',
    'end one',
    'two',
    'tick',
    'three'
  ]
  var i = 0

  function log (m) {
    t.equal(m, expect[i], m + ' === ' + expect[i])
    ++i
    if (i === expect.length)
      t.end()
  }

  function method (name, cb) {
    log('method ' + name)
    process.nextTick(cb)
  }

  var one = inf('foo', function () {
    log('start one')
    var three = inf('foo', function () {
      log('three')
    })
    if (three) method('three', three)
    log('end one')
  })

  method('one', one)

  var two = inf('foo', function () {
    log('two')
  })
  if (two) method('one', two)

  process.nextTick(log.bind(null, 'tick'))
})

test('parameters', function (t) {
  t.plan(8)

  var a = inf('key', function (first, second, third) {
    t.equal(first, 1)
    t.equal(second, 2)
    t.equal(third, 3)
  })
  t.ok(a, 'first returned cb function')

  var b = inf('key', function (first, second, third) {
    t.equal(first, 1)
    t.equal(second, 2)
    t.equal(third, 3)
  })
  t.notOk(b, 'second should get falsey inflight response')

  setTimeout(function () {
    a(1, 2, 3)
  })
})

test('throw (a)', function (t) {
  var calleda = false
  var a = inf('throw', function () {
    t.notOk(calleda)
    calleda = true
    throw new Error('throw from a')
  })
  t.ok(a, 'first returned cb function')

  var calledb = false
  var b = inf('throw', function () {
    t.notOk(calledb)
    calledb = true
  })
  t.notOk(b, 'second should get falsey inflight response')

  setTimeout(function () {
    try {
      a()
    } catch(e) {
      t.ok(calleda)
      t.notOk(calledb)
      var c = inf('throw', function () {})
      t.ok(c, 'third returned cb function because it cleaned up')
      c()
      t.end()
    }
  })
})

test('throw (b)', function (t) {
  var calleda = false
  var a = inf('throw', function () {
    t.notOk(calleda)
    calleda = true
  })
  t.ok(a, 'first returned cb function')

  var calledb = false
  var b = inf('throw', function () {
    t.notOk(calledb)
    calledb = true
    throw new Error('throw from b')
  })
  t.notOk(b, 'second should get falsey inflight response')

  setTimeout(function () {
    try {
      a()
    } catch(e) {
      t.ok(calleda)
      t.ok(calledb)
      var c = inf('throw', function () {})
      t.ok(c, 'third returned cb function because it cleaned up')
      c()
      t.end()
    }
  })
})

test('throw (zalgo)', function (t) {
  var calleda = false
  var calledZalgo = false
  var a = inf('throw', function () {
    t.notOk(calleda)
    calleda = true

    var zalgo = inf('throw', function () {
      t.notOk(calledZalgo)
      calledZalgo = true
    })
    t.notOk(zalgo, 'zalgo should get falsey inflight response')
    throw new Error('throw from a')
  })
  t.ok(a, 'first returned cb function')

  var calledb = false
  var b = inf('throw', function () {
    t.notOk(calledb)
    calledb = true
  })
  t.notOk(b, 'second should get falsey inflight response')

  setTimeout(function () {
    try {
      a()
    } catch(e) {
      process.nextTick(function () {
        t.ok(calleda)
        t.notOk(calledb)
        t.ok(calledZalgo)
        var c = inf('throw', function () {})
        t.ok(c, 'third returned cb function because it cleaned up')
        c()
        t.end()
      })
    }
  })
})
