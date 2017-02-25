let crudify = require('../index')
let Article = require('../models/article')


module.exports = function(app){
  app.use('/articles', crudify({
    Model: Article,
  }))
}