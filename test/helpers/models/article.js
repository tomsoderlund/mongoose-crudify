const mongoose = require('mongoose')

const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: String,
  secret: String,
  likes: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('Article', articleSchema)
