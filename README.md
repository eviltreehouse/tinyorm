## TinyORM: It's more about what it's not!

### Abstract
Run a micro-app w/ a [sqlite3](http://github.com/mapbox/node-sqlite3) backend? _tinyorm_ will stand-in as your zero-prod-dependency ORM layer. Initially, the
_tinyorm_ `0.x` branch had code to support several "Adapters" to other RDMS systems, but then it became clear it was costing dozens of hours just to try to contend with already established, prod-hardened, and full-featured ORM solutions. So the module was stripped to its core components to make it super light and nimble! 

### Basics
_tinyorm_ provides general SELECT, INSERT, UPDATE, and DELETE functionality. Its job is to get some ORM-age around your table structure as quickly as possible, and yield to _"convention over configuration"_ so as to require minimal code to be written to get up and running. The root `Model` class can be subclassed to add any cool functionality you think is missing to make your project easier. Feel free to submit a pull request if you think what you've come up with will save other devs time and headaches :) 

### Quick Example

##### AppModel.js
```js
'use strict';
const Model = require('tinyorm');

// Make a "scope" class to hold all of your models
class AppModel extends Model {}
module.exports = Model.Scope(AppModel);
```

##### Thing.js
```js
'use strict';

var Scope = require('./AppModel');

class Thing extends Scope {
    constructor(in_thing) {
        super(in_thing, Scope);
    }
};


// Link your model to your scope
Scope.model(Thing);

// ...and set some model-specifics:
Thing.Table = function() { return "things"; }

module.exports = Thing;
```

### UseModel.js
```js
// Make an sqlite handle
const dbh = require('node-sqlite3').Database({...});

// Link it to your model
const Model = require('./AppModel');
Model.Db(dbh);

// Get our `Thing` model
const Thing = Model.model('Thing');

// Retrieve a thing:
Thing.Find(144).then((thing) => {
    console.log(thing.id, 'is', thing.val('name', '<noname>'));
});

// Search for things (binds, raw, and combo criteria):
Thing.where(
    { 
    'class_id': 199,  // simple
    'min_cost': [ "cost >= 9.99" ], // raw
    'rating': [ "BETWEEN :min_rating AND :max_rating", // raw+bind
        { min_rating: 25, max_rating: 100 }]
     }
    ).then((things) => {
    console.log(things.length, 'matching things found.');
});

// Make a thing:
var th = new Thing({ 'class_id': 200, 'name': "Thing A" });
th.insert().then((th) => {
    console.log('ID', th.id, 'inserted => ', th.val('name'));
});

// Update a thing:
Thing.Find(144).then((thing) => {
    var old_name = thing.val('name');
    thing.setVal('name', 'New Name').update().then((th) => {
        console.log(th.id, 'renamed from', old_name, 'to', th.val('name'));
    });
});

// Delete a thing:
th.delete().then((th) => {
    if (! th.id) console.log("Deleted.");
});

```

### License

_tinyorm_ is available under the MIT License. In short: do whatever you want with the code but don't get mad if it melts your server, or copy/paste it and claim it's your own!