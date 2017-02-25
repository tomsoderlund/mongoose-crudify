const mongoose = require('mongoose')

//process.env now has the keys and values you defined in your .env file.
require('dotenv').config()

const connectionString =
  `${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`

mongoose.connect(connectionString)

module.exports = mongoose