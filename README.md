Tubbs-RiakStorage
=================

Tubbs-RiakStorage is a riak adaptor for [Tubbs](https://github.com/dandean/tubbs).

Example:
--------

```js
var Tubbs = require('tubbs');
var RiakStorage = require('tubbs-riakstorage');

var User = Tubbs.create({

  // Persist our data with Riak
  dataStore: new RiakStorage({ bucket: 'users' }),

  // ...

});
```

See [Tubbs](https://github.com/dandean/tubbs) for more information.
