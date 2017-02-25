//let articles = require('../app/controllers/articles')
let crudify = require('../index')
let Article = require('../models/article')


module.exports = function(app){
  app.use('/articles', crudify({
    Model: Article,
    beforeActions: [],
    actions: {

    }
  }))
}