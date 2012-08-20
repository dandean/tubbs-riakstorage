Tubbs-Riak
==========

Tubbs-Riak is a riak adaptor for [Tubbs](https://github.com/dandean/tubbs).

Example:
--------

```js
var Tubbs = require('tubbs');
var RiakStore = require('tubbs-riak');

var User = Tubbs.create({

  // Persist our data with Riak
  dataStore: new RiakStore({ bucket: 'users' }),

  // ...

});
```

See [Tubbs](https://github.com/dandean/tubbs) for more information.
