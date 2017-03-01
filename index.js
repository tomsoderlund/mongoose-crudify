const express = require('express')
const _ = require('lodash')
const errors = require('./lib/errors')
const helpers = require('./lib/helpers')

function crudify (params) {
  if (!params || params.constructor !== Object) {
    throw new Error(errors.argumentTypeError)
  }
  if (!params.Model) {
    throw new Error(errors.missingModelError)
  }

  params.identifyingKey = params.identifyingKey || '_id'
  params.loadModel = params.loadModel || true
  params.beforeActions = params.beforeActions || []
  params.afterActions = params.afterActions || []

  params.actions = params.actions || {}
  params.actions =
    _.defaults(params.actions,
               crudify.getDefaultActions(params.Model,
                                         params.identifyingKey,
                                         params.selectFields))

  params.options = params.options || {}
  params.options = _.defaults(params.options, {
    caseSensitive: false,
    mergeParams: false,
    strict: false
  })

  /**
   * add before and after hooks
   */
  const actionNames = Object.keys(params.actions)
  const hooks = {}
  // load model on update and read actions
  if (params.loadModel) {
    params.beforeActions.unshift({
      middlewares: [
        crudify.getLoadModel(params.Model,
                             params.identifyingKey,
                             params.selectFields)
      ],
      only: ['read', 'update']
    })
  }
  helpers.addHooks(hooks, 'before', params.beforeActions, actionNames)
  helpers.addHooks(hooks, 'after', params.afterActions, actionNames)

  const router = params.router || express.Router(params.options)

  for (let action in params.actions) {
    let httpMethod = crudify.actionsMapping[action] || action

    if (typeof router[httpMethod] === 'function') {
      let url = crudify.actionsNeedParam.includes(action)
        ? ('/:' + params.identifyingKey)
        : '/'
      router[httpMethod](url,
                         hooks['before'][action],
                         params.actions[action],
                         hooks['after'][action])
    }
  }

  crudify.exposure = {
    params,
    hooks,
    actionNames
  }

  return router
}

crudify.actionsMapping = {
  list: 'get',
  create: 'post',
  read: 'get',
  update: 'put',
  delete: 'delete'
}

crudify.actionsNeedParam = ['read', 'update', 'delete']

crudify.getLoadModel = function (Model, identifyingKey, selectFields) {
  return function _loadModel (req, res, next) {
    let condition = {}
    condition[identifyingKey] = req.params[identifyingKey]

    let query = Model.findOne(condition)
    if (selectFields) {
      query.select(selectFields)
    }

    query.exec((err, doc) => {
      if (err) return res.status(500).json(err)
      if (doc) {
        req.crudify = {
          [Model.modelName.toLowerCase()]: doc
        }
        next()
      } else {
        return res.sendStatus(404)
      }
    })
  }
}

crudify.getDefaultActions = (Model, identifyingKey, selectFields) => {
  let modelName = Model.modelName.toLowerCase()

  return {
    /** GET / - List all entities */
    list: ({ params }, res) => {
      let query = Model.find(params)
      if (selectFields) {
        query.select(selectFields)
      }

      query.exec((err, docs) => {
        if (err) {
          return res.json(err)
        }
        res.json(docs)
      })
    },

    /** POST / - Create a new entity */
    create: ({ body }, res) => {
      var newDoc = new Model()
      Object.assign(newDoc, body)
      newDoc.save(function (err) {
        if (err) {
          return res.json(err)
        }
        res.json(newDoc)
      })
    },

    /** GET /:id - Return a given entity */
    read: ({crudify}, res) => {
      res.json(crudify[modelName])
    },

    /** PUT /:id - Update a given entity */
    update: ({ crudify, body }, res) => {
      for (let key in body) {
        if (key !== '_id') {
          crudify[modelName][key] = body[key]
        }
      }
      crudify[modelName].save(function (err) {
        if (err) {
          return res.json(err)
        }

        res.json(crudify[modelName])
      })
    },

    /** DELETE /:id - Delete a given entity */
    delete: ({ params }, res) => {
      let condition = {}
      condition[identifyingKey] = params[identifyingKey]

      Model.remove(condition, function (err) {
        if (err) {
          return res.json(err)
        }
        res.sendStatus(204)
      })
    }
  }
}

module.exports = crudify
