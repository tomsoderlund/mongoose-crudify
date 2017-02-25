const mongoose = require('mongoose')

const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: String,
  secret: String
})

module.exports = mongoose.model('Article', articleSchema)
