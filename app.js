const express = require('express')

//process.env now has the keys and values you defined in your .env file.
require('dotenv').config()
const app = express()
require('./config')(app)

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port 3000!')
})

module.exports = app