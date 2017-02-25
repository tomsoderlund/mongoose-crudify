mongoose-crudify
============
Generates crud routes for mongoose model

## Install
```bash
$ npm i -S mongoose-crudify
```

## Example
```js
var mongooseCrudify = require('mongoose-crudify')
var Article = require('../app/models/article')

/**
 * By default, following routes are generated
 *  list - GET /articles/
 *  create- POST /articles/
 *  read - GET /articles/{id}/
 *  update- PUT /articles/{id}/
 *  delete- DELETE /articles/{id}/
 */
app.use('/articles', mongooseCrudify({
    Model: Article
}))
```

## Available options
```js
var mongooseCrudify = require('mongoose-crudify')
var Article = require('../app/models/article')


app.use('/articles', mongooseCrudify({
    Model: Article, // mongoose model
    identifyingKey: '_id', // route param name, defaults to '_id'
    selectFields: 'pub1 pub2 -secret', // http://mongoosejs.com/docs/api.html#query_Query-select

    // load model on update and read actions, defaults to true
    // store the found model instance in req, eg: req.crudify.article
    // if changed to false, you must override the update and read middlewares
    loadModel: true,
    beforeActions: [
      {
        middlewares: [ensureLogin],
        except: ['list', 'read']
      }
    ],
    actions: {
        // default actions: list, create, read, update, delete
        // any non-overridden action will be in functional

        //override update
        update: function (req, res, next) {}
    },
    afterActions: [
      {
        middlewares: [updateViewCount],
        only: ['read']
      },
      {
        middlewares: [redirectToArticle],
        only: ['update']
      }
    ],
    options: {
        // https://expressjs.com/en/api.html#express.router
        // all default to false
        caseSensitive: false,
        mergeParams: false,
        strict: false
    }
  }))
```
