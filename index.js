let express = require('express')
let _ = require('lodash')

function crudify(params){
  if(!params || params.constructor !== Object)
    throw 'You must provide an object as argument to crudify function'
  if(!params.Model)
    throw 'You must provide a mongoose model, eg. {Model: User}'

  /**
   * extract values from params object
   */
  let Model = params.Model
  let identifyingKey = params.identifyingKey || 'id'
  let loadModel = params.loadModel || true
  let beforeActions = params.beforeActions || []
  let afterActions = params.afterActions || []

  params.actions = params.actions || {}
  let actions = 
    _.defaults(params.actions, crudify.getDefaultActions(Model,identifyingKey))

  params.options = params.options || {}
  let options = _.defaults(params.options,{
    caseSensitive: false,
    mergeParams: false,
    strict: false
  })

  /**
   * add before and after hooks
   */
  let actionNames = Object.keys(actions)
  let hooks = {
    before:{},
    after: {}
  }
  actionNames.forEach(actionName => {
    hooks['before'][actionName] = []
    hooks['after'][actionName] = []
  })

  // load modle on update and read actions
  if(loadModel)
    beforeActions.unshift({
      middlewares: [
        function(req, res, next){
          Model.findOne({_id: req.params[identifyingKey]}, function(err, doc) {
            if (err) return res.status(500).json(err)
            if (doc){
              req.crudify = {
                [Model.modelName.toLowerCase()]: doc
              }
              next()
            }else{
              return res.sendStatus(404)
            }
          })
        }
      ],
      only: ['read', 'update']
    })

  _addHooks('before',beforeActions,actionNames)
  _addHooks('after',afterActions,actionNames)

  let router = express.Router(options)

  for (let action in actions) {
    let httpMethod = crudify.actionsMapping[action] || action

    if (typeof router[httpMethod] === 'function') {
      let url = crudify.actionsNeedParam.includes(action) ? ('/:'+identifyingKey) : '/'
      router[httpMethod](url, 
                         hooks['before'][action], 
                         actions[action], 
                         hooks['after'][action])
    }
  }

  return router

  function _addHooks(type, hookActions){
    let actionsNeedHook = actionNames
    hookActions.forEach( hook => {
      if(hook.only){
        actionsNeedHook = hook.only
      }else if(hook.except){
        actionsNeedHook = Object.keys(hooks[type])
          .filter(actionName => !hook.except.includes(actionName))
      }
      actionsNeedHook.forEach(actionName => {
        hooks[type][actionName] =
          hooks[type][actionName].concat(hook.middlewares)
      })
    })
  }
}

/**
 * mapping between actions and http verbs
 * @type {Object}
 */
crudify.actionsMapping = { 
  list: 'get',
  create: 'post',
  read: 'get',
  update: 'put',
  delete: 'delete'
}

/**
 * list of actions that require url params
 * @type {Array}
 */
crudify.actionsNeedParam = ['read', 'update','delete']

/**
 * get default actions
 * @param  {[type]} Model [description]
 * @return {[type]}       [description]
 */
crudify.getDefaultActions = (Model, identifyingKey) => {
  let modelName = Model.modelName.toLowerCase()
  return { 
    /** GET / - List all entities */
    list({ params }, res) {
      Model.find(params, (err, docs)=> {
        if(err)
          return res.json(err)
        res.json(docs)
      })
    },

    /** POST / - Create a new entity */
    create({ body }, res) {
      var newDoc = new Model()
      Object.assign(newDoc, body)
      newDoc.save(function(err){
        if (err){
          return res.json(err)
        }
        res.json(newDoc)
      })
    },

    /** GET /:id - Return a given entity */
    read({crudify}, res) {
      res.json(crudify[modelName])
    },

    /** PUT /:id - Update a given entity */
    update({ crudify, body }, res) {
      for (let key in body) {
        if (key!=='_id') {
          crudify[modelName][key] = body[key]
        }
      }
      crudify[modelName].save(function(err){
        if (err){
          return res.json(err)
        }

        res.json(crudify[modelName])
      })
    },

    /** DELETE /:id - Delete a given entity */
    delete({ params }, res) {
      Model.remove({_id: params[identifyingKey]}, function(err){
        if(err){
          return res.json(err)
        }
        res.sendStatus(204)
      })
    }
  }
}

module.exports = crudify
