# tsDiskDB

A Lightweight Disk based JSON Database with a MongoDB like API for Node, written in TypeScript.

## Contents

- [tsDiskDB](#tsdiskdb)
  - [Contents](#contents)
  - [Getting Started](#getting-started)
    - [Load collections](#load-collections)
      - [Load multiple collections](#load-multiple-collections)
    - [Save models in a collection](#save-models-in-a-collection)
    - [Search a collection](#search-a-collection)
    - [Find many models in a collection](#find-many-models-in-a-collection)
      - [Find one model in a collection](#find-one-model-in-a-collection)
    - [Update a collection](#update-a-collection)
    - [Remove a collection](#remove-a-collection)
    - [Count models in a collection](#count-models-in-a-collection)
- [Appendix](#appendix)

## Getting Started

Install the module:

```bash
$ npm install tsdiskdb
```

Import & intitialize it with:

```ts
var db = require("tsdiskdb");
// or with the import syntax, if supported:
import db from "tsdiskdb";
```

Then, connect to a `.json` 'DB' with:

```ts
db.connect(pathToFolder, ["filename"]);
```

Where `filename` is the name of the `.json` file. You can omit the extension. This method also returns the instance itself so it can be used for chaining calls as well.

This will check for a directory at given path, if it does not exits, tsDiskDB will throw an error and exit.

If the directory exists but the file does not exist, tsDiskDB will create it for you.

**Note** : If you have manually created a JSON file, please make sure it contains a valid JSON array, otherwise tsDiskDB
will return an empty array (`[]`).

---

### Load collections

Alternatively you can also load collections with the following syntaxes:

```ts
var db = require("tsdiskdb");

// variant 1
db = db.connect("/path/to/folder");
db.loadCollections(["articles"]);

// variant 2
db.connect("/path/to/folder");
db.loadCollections(["articles"]);

// variant 3
db.connect("/path/to/folder").loadCollections(["articles"]);
//or
db.connect("/path/to/folder", ["articles"]);
```

#### Load multiple collections

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles", "users"]);
```

---

### Save models in a collection

```ts
db.collectionName.save(object);
```

Once you have loaded a collection, you can access the collection's methods the following way:

```ts
db.collectionName.methodName;
```

To save a modified instance of a collection, use:

```ts
var db = require("tsdiskdb");
db.connect("db", ["articles"]);

var article = {
	title: "Article 1",
	published: "today",
	rating: "10/10",
};

db.articles.save(article);
```

The saved data will be

```ts
[
	{
		title: "Article 1",
		published: "today",
		rating: "10/10",
		_id: "d6f39a8dc7494d19a3eb60a008e71cd9",
	},
];
```

You can also save multiple objects at once:

```ts
var db = require("tsdiskdb");
db.connect("db", ["articles"]);
var article1 = {
	title: "Article 1",
	published: "today",
	rating: "10/10",
};

var article2 = {
	title: "Article 2",
	published: "yesterday",
	rating: "7/10",
};

db.articles.save([article1, article2]);
```

And this will return the inserted objects

```ts
[
	{
		title: "Article 1",
		published: "today",
		rating: "10/10",
		_id: "628574cc74384f8eb07236ef99140773",
	},
	{
		title: "Article 2",
		published: "yesterday",
		rating: "7/10",
		_id: "fd976e7ba0c64eb8acc2855701c32dfb",
	},
];
```

---

### Search a collection

To search a collection, use:

-   `db.collectionName.find({ query })` to find many models matching the specified criteria
-   `db.collectionName.findOne({ query })` to find just one model matching the specified criteria

### Find many models in a collection

Use the following code to find all models in a collection:

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.find();
```

This will return all the records

```ts
[
	{
		title: "tsdiskDB rocks",
		published: "today",
		rating: "5 stars",
		_id: "0f6047c6c69149f0be0c8f5943be91be",
	},
];
```

You can also query with a criteria that is a partial object of the original one stored.

For example:

```ts
db.articles.find({ rating: "7/10", published: "yesterday" });
```

With the data inside the collection fed by the aforementioned snippets, this would return:

```json
[
	{
		"title": "Article 2",
		"published": "yesterday",
		"rating": "7/10",
		"_id": "fd976e7ba0c64eb8acc2855701c32dfb"
	}
]
```

Since tsDiskDB is mostly for lightweight data storage, avoid nested structures and huge datasets.

#### Find one model in a collection

```ts
db.articles.findOne();
```

If you do not pass a query, tsDiskDB will return the first article in the collection. If you pass a query, it will return first article in the filtered data.

```ts
db.articles.findOne({ _id: "0f6047c6c69149f0be0c8f5943be91be" });
```

Note that models can also be queried by their `_id` field, like above.

---

### Update a collection

```ts
db.collectionName.update(query, data, options);
```

You can also update one or many objects in the collection

```ts
options = {
	multi: false, // update multiple - default false
	upsert: false, // if object is not found, add it (update-insert) - default false
};
```

Sample usage:

```ts
var query = {
	title: "tsdiskDB rocks",
};

var dataToBeUpdated = {
	title: "tsdiskDB rocks again!",
};

var options = {
	multi: false,
	upsert: false,
};

var updated = db.articles.update(query, dataToBeUpdated, options);
console.log(updated); // { updated: 1, inserted: 0 }
```

---

### Remove a collection

```ts
db.collectionName.remove(query, multi);
```

You can remove the entire collection (including the file) or you can remove the matched objects by passing in a query. When you pass a query, you can either delete all the matched objects or only the first one by passing `multi` as `false`. The default value of `multi` is `true`.

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.remove({ rating: "5 stars" });
```

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.remove({ rating: "5 stars" }, true); // remove all matched. Default - multi = true
```

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.remove({ rating: "5 stars" }, false); // remove only the first match
```

Using remove without any params will delete the file and will remove the db instance.

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.remove();
```

After the above operation `db.articles` is `undefined`.

---

### Count models in a collection

```ts
db.collectionName.count();
```

Will return the count of objects in the Collection

```ts
var db = require("tsdiskdb");
db.connect("/path/to/folder", ["articles"]);
db.articles.count(); // will give the count
```

# Appendix

The project was originally based off [`diskdb`](https://github.com/arvindr21/diskDB) and is now a more advanced, improved version of the project, written `TypeScript`.
