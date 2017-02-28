/* global describe, it */
const expect = require('chai').expect
const mongooseCrudify = require('../')
const errors = require('../lib/errors')
const mongoose = require('mongoose')
const ArticleSchema = mongoose.Schema({})
const Article = mongoose.model('DefaultArticle', ArticleSchema)

function cb1 () {}
function cb2 () {}

describe('mongooseCrudify', function () {
  it('should throw correct errors', function () {
    expect(() => { mongooseCrudify() }).to.throw(errors.argumentTypeError)
    expect(() => { mongooseCrudify({}) }).to.throw(errors.missingModelError)
    expect(() => { mongooseCrudify({}) }).to.not.throw(errors.argumentTypeError)
  })
  it('should expose params, hooks, actionNames', function () {
    mongooseCrudify({
      Model: Article
    })
    expect(mongooseCrudify.exposure).to.exist
    expect(mongooseCrudify.exposure.params).to.exist
    expect(mongooseCrudify.exposure.hooks).to.exist
    expect(mongooseCrudify.exposure.actionNames).to.exist
  })
  it('should expose router', function () {
    let router = mongooseCrudify({
      Model: Article
    })
    expect(router.stack).to.have.lengthOf(5)
  })

  describe('static #getDefaultActions', function () {
    it('should return object containing default actions', function () {
      let obj = mongooseCrudify.getDefaultActions(Article)
      expect(obj.list).to.exist
      expect(obj.create).to.exist
      expect(obj.read).to.exist
      expect(obj.update).to.exist
      expect(obj.delete).to.exist
    })
  })

  describe('adding before and after hooks', function () {
    it('should load model first on read and update', function () {
      mongooseCrudify({
        Model: Article,
        beforeActions: [{middlewares: [cb1, cb2]}]
      })
      expect(mongooseCrudify.exposure.hooks.before['read'][0].name)
        .to.equal('_loadModel')
      expect(mongooseCrudify.exposure.hooks.before['update'][0].name)
        .to.equal('_loadModel')
    })
    it('should add hooks to all actions', function () {
      mongooseCrudify({
        Model: Article,
        beforeActions: [{middlewares: [cb1, cb2]}],
        afterActions: [{middlewares: [cb1, cb2]}]
      })
      mongooseCrudify.exposure.actionNames.forEach(actionName => {
        expect(mongooseCrudify.exposure.hooks.before[actionName])
          .to.include(cb1, cb2)
        expect(mongooseCrudify.exposure.hooks.after[actionName])
          .to.include(cb1, cb2)
      })
    })
    it('should only add hooks to create', function () {
      mongooseCrudify({
        Model: Article,
        beforeActions: [{
          middlewares: [cb1, cb2],
          only: ['create']
        }],
        afterActions: [{
          middlewares: [cb1, cb2],
          only: ['create']
        }]
      })
      mongooseCrudify.exposure.actionNames.forEach(actionName => {
        if (actionName === 'create') {
          expect(mongooseCrudify.exposure.hooks.before[actionName])
            .to.include(cb1, cb2)
          expect(mongooseCrudify.exposure.hooks.after[actionName])
            .to.include(cb1, cb2)
        } else {
          expect(mongooseCrudify.exposure.hooks.before[actionName])
            .to.not.include(cb1, cb2)
          expect(mongooseCrudify.exposure.hooks.after[actionName])
            .to.not.include(cb1, cb2)
        }
      })
    })
    it('should add hooks to all except create', function () {
      mongooseCrudify({
        Model: Article,
        beforeActions: [{
          middlewares: [cb1, cb2],
          except: ['create']
        }],
        afterActions: [{
          middlewares: [cb1, cb2],
          except: ['create']
        }]
      })
      mongooseCrudify.exposure.actionNames.forEach(actionName => {
        if (actionName === 'create') {
          expect(mongooseCrudify.exposure.hooks.before[actionName])
            .to.not.include(cb1, cb2)
        } else {
          expect(mongooseCrudify.exposure.hooks.after[actionName])
            .to.include(cb1, cb2)
        }
      })
    })
  })
})
