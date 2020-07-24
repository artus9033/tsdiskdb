# diskDB

A Lightweight Disk based JSON Database with a MongoDB like API for Node, written in TypeScript.

## Contents

- [diskDB](#diskdb)
  - [Contents](#contents)
  - [Getting Started](#getting-started)
  - [Documentation](#documentation)
    - [Connect to DB](#connect-to-db)
    - [Load Collections](#load-collections)
      - [Load Multiple Collections](#load-multiple-collections)
    - [Write/Save to Collection](#writesave-to-collection)
    - [Read from Collection](#read-from-collection)
      - [db.collectionName.find()](#dbcollectionnamefind)
      - [db.collectionName.findOne(query)](#dbcollectionnamefindonequery)
    - [Update Collection](#update-collection)
    - [Remove Collection](#remove-collection)
    - [Count](#count)

## Getting Started
Install the module locally :  
```bash
$ npm install tsdiskdb
```

```js
var db = require('tsdiskdb');
db = db.connect('/path/to/db-folder', ['collection-name']);
// you can access the traditional JSON DB methods here
```

## Documentation
### Connect to DB
```js
db.connect(pathToFolder, ['filename']);
```
Filename will be the name of the JSON file. You can omit the extension, tsdiskDB will take care of it for you.

```js
var db = require('tsdiskdb');
db = db.connect('/examples/db', ['articles']);
// or simply
db.connect('/examples/db', ['articles']);
```

This will check for a directory at given path, if it does not exits, tsdiskDB will throw an error and exit.

If the directory exists but the file/collection does not exist, tsdiskDB will create it for you.

**Note** : If you have manually created a JSON file, please make sure it contains a valid JSON array, otherwise tsdiskDB
will return an empty array.

```js
[]
```
Else it will throw an error like

```bash
undefined:0

^
SyntaxError: Unexpected end of input
```
---
### Load Collections
Alternatively you can also load collections like

```js
var db = require('tsdiskdb');
// this
db = db.connect('/examples/db');
db.loadCollections(['articles']);
//or
db.connect('/examples/db');
db.loadCollections(['articles']);
//or
db.connect('/examples/db')
  .loadCollections(['articles']);
//or
db.connect('/examples/db', ['articles']);
```
#### Load Multiple Collections

```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles','comments','users']);
```
---
### Write/Save to Collection
```js
db.collectionName.save(object);
```
Once you have loaded a collection, you can access the collection's methods using the dot notation like

```js
db.[collectionName].[methodname]
```
To save the data, you can use
```js
var db = require('tsdiskdb');
db.connect('db', ['articles']);
var article = {
    title : "tsdiskDB rocks",
    published : "today",
    rating : "5 stars"
}
db.articles.save(article);
// or
db.articles.save([article]);
```
The saved data will be
```js
[
    {
        "title": "tsdiskDB rocks",
        "published": "today",
        "rating": "5 stars",
        "_id": "0f6047c6c69149f0be0c8f5943be91be"
    }
]
```
You can also save multiple objects at once like

```js
var db = require('tsdiskdb');
db.connect('db', ['articles']);
var article1 = {
    title : 'tsdiskDB rocks',
    published : 'today',
    rating : '5 stars'
}

var article2 = {
    title : 'tsdiskDB rocks',
    published : 'yesterday',
    rating : '5 stars'
}

var article3 = {
    title : 'tsdiskDB rocks',
    published : 'today',
    rating : '4 stars'
}
db.articles.save([article1, article2, article3]);
```
And this will return the inserted objects

```js
[ { title: 'tsdiskDB rocks',
    published: 'today',
    rating: '4 stars',
    _id: 'b1cdbb3525b84e8c822fc78896d0ca7b' },
  { title: 'tsdiskDB rocks',
    published: 'yesterday',
    rating: '5 stars',
    _id: '42997c62e1714e9f9d88bf3b87901f3b' },
  { title: 'tsdiskDB rocks',
    published: 'today',
    rating: '5 stars',
    _id: '4ca1c1597ddc4020bc41b4418e7a568e' } ]
```
---
### Read from Collection
There are 2 methods available for reading the JSON collection
* db.collectionName.find(query)
* db.collectionName.findOne(query)


#### db.collectionName.find()
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.find();
```
This will return all the records
```js
[{
    title: 'tsdiskDB rocks',
    published: 'today',
    rating: '5 stars',
    _id: '0f6047c6c69149f0be0c8f5943be91be'
}]
```
You can also query with a criteria like
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.find({rating : "5 stars"});
```
This will return all the articles which have a rating of 5.

Find can take multiple criteria
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.find({rating : "5 stars", published: "yesterday"});
```
This will return all the articles with a rating of 5, published yesterday.

Nested JSON :

```js
var articleComments = {
    title: 'tsdiskDB rocks',
    published: '2 days ago',
    comments: [{
        name: 'a user',
        comment: 'this is cool',
        rating: 2
    }, {
        name: 'b user',
        comment: 'this is ratchet',
        rating: 3
    }, {
        name: 'c user',
        comment: 'this is awesome',
        rating: 2
    }]
}
```
```js
var savedArticle = db.articles.save([articleComments);
foundArticles = db.articles.find({rating : 2});
```
Since tsdiskDB is mostly for light weight data storage, avoid nested structures and huge datasets.

#### db.collectionName.findOne(query)
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.findOne();
```

If you do not pass a query, tsdiskDB will return the first article in the collection. If you pass a query, it will return first article in the filtered data.

```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.findOne({_id: '0f6047c6c69149f0be0c8f5943be91be'});
```
---
### Update Collection
```js
db.collectionName.update(query, data, options);
```

You can also update one or many objects in the collection
```js
options = {
    multi: false, // update multiple - default false
    upsert: false // if object is not found, add it (update-insert) - default false
}
```
Usage
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);

var query = {
  title : 'tsdiskDB rocks'
};

var dataToBeUpdate = {
  title : 'tsdiskDB rocks again!',
};

var options = {
   multi: false,
   upsert: false
};

var updated = db.articles.update(query, dataToBeUpdate, options);
console.log(updated); // { updated: 1, inserted: 0 }
```
---
### Remove Collection
```js
db.collectionName.remove(query, multi);
```
You can remove the entire collection (including the file) or you can remove the matched objects by passing in a query. When you pass a query, you can either delete all the matched objects or only the first one by passing `multi` as `false`. The default value of `multi` is `true`.

```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.remove({rating : "5 stars"});
```
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.remove({rating : "5 stars"}, true); // remove all matched. Default - multi = true
```

```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.remove({rating : "5 stars"}, false); // remove only the first match
```
Using remove without any params will delete the file and will remove the db instance.
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.remove();
```
After the above operation `db.articles` is `undefined`.

---
### Count
```js
db.collectionName.count();
```
Will return the count of objects in the Collection
```js
var db = require('tsdiskdb');
db.connect('/examples/db', ['articles']);
db.articles.count(); // will give the count
```