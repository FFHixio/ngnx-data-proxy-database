'use strict'

let test = require('tape')

require('ngn')
require('ngn-data')
require('../')

let meta = function () {
  return {
    idAttribute: 'testid',
    fields: {
      firstname: null,
      lastname: null,
      val: {
        min: 10,
        max: 20,
        default: 15
      }
    }
  }
}

test('Primary Namespace', function (t) {
  t.ok(NGNX.DATA.DatabaseProxy !== undefined, 'NGNX.DATA.DatabaseProxy is defined globally.')
  t.end()
})

test('Self Inspection', function (t) {
  let m = meta()
  let NewModel = new NGN.DATA.Model(m)
  let dataset = new NGN.DATA.Store({
    model: NewModel,
    proxy: new NGNX.DATA.DatabaseProxy()
  })

  t.ok(dataset.proxy.type === 'store', 'Recognized store.')

  m.proxy = new NGNX.DATA.DatabaseProxy()

  let TestRecord = new NGN.DATA.Model(m)
  let rec = new TestRecord({
    firstname: 'The',
    lastname: 'Doctor'
  })

  t.ok(rec.proxy.type === 'model', 'Recognized model.')
  t.end()
})

test('Data Cryptography', function (t) {
  let m = meta()
  m.proxy = new NGNX.DATA.DatabaseProxy({
    encryptionKey: 't3stK3y'
  })

  let NewModel = new NGN.DATA.Model(m)

  let record = new NewModel({
    firstname: 'The',
    lastname: 'Doctor'
  })

  let hash = record.proxy.encrypt(JSON.stringify(record.data))
  t.ok(hash !== null && hash !== undefined, 'Content successfully encrypted.')

  let out = record.proxy.decrypt(hash)
  t.ok(typeof JSON.parse(out) === 'object', 'Decrypted to object.')
  t.ok(JSON.parse(out).lastname === 'Doctor', 'Decrypted data matches unencrypted data.')

  t.end()
})

test('Post Operations', function (t) {
  let m = meta()
  let NewModel = new NGN.DATA.Model(m)
  let dataset = new NGN.DATA.Store({
    model: NewModel,
    proxy: new NGNX.DATA.DatabaseProxy()
  })

  dataset.once('save', () => {
    t.pass('Save event recognized.')

    dataset.once('fetch', () => {
      t.pass('Fetch event recognized.')

      dataset.proxy.postsave(() => {
        t.pass('post-save callback executed.')

        dataset.proxy.postfetch(() => {
          t.pass('post-fetch callback executed.')
          t.end()
        })
      })
    })

    dataset.proxy.postfetch()
  })

  dataset.proxy.postsave()
})
