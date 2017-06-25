let crudify = require('../../../')
let Article = require('../models/article')

module.exports = function (app) {
  app.use('/articles', crudify({
    Model: Article,
    beforeActions: [
      {
        middlewares: [ensureLogin],
        except: ['list', 'read']
      }
    ],
    actions: {
      // override so to call next()...
      read: ({crudify}, res, next) => {
        res.json(crudify.article)
        next()
      }
    },
    afterActions: [
      {
        middlewares: [updateViewCount],
        only: ['read']
      }
    ]
  }))
}

function ensureLogin (req, res, next) {
  if (req.get('X-USERNAME') !== 'ryo') {
    return res.sendStatus(401)
  }
  next()
}

function updateViewCount (req, res) {
  let article = req.crudify.article
  article.likes++
  article.save()
}
