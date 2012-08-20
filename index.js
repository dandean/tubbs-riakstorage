var guid = require("guid");
var riak = require('riak-js');

/**
 * createError(name, message) -> Error
 * - name (String): Name of the error, such as 'ArgumentError'.
 * - message (String): Error message.
 *
 * Creates a named error for better error handling.
**/
function createError(name, message) {
  var error = new Error(message);
  error.name = name;
  return error;
}

var defaults = {
  host: "127.0.0.1",
  port: 8098,
  debug: true
};

/**
 * new RiakStorage(config)
 * - config (Object): Object hash of configuration options.
 *
 * **Options**
 * - bucket (String): Required, the riak bucket which stores the model documents.
 * - host: (String): Optional, riak's hostname. Defaults to '127.0.0.1'.
 * - port: (Number): Optional, riak's http port. Defaults to 8098.
 * - debug: (Boolean): Optional, if debug messages should print. Defaults to `true`.
**/
function RiakStorage(config) {
  if (!config.bucket) throw new Error('The "bucket" option is required.');

  this.bucket = config.bucket;

  this.client = riak.getClient({
    host: config.host || defaults.host,
    port: config.port || defaults.port,
    debug: (config.debug === undefined) ? defaults.debug : config.debug
  });
}

/**
 * RiakStorage#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
RiakStorage.prototype.all = function(cb) {
  var result = [];
  var Type = this.DataType;

  this.client.getAll(this.bucket, function(e, data, meta) {
    var results = [];

    if (e) cb(e, results);
  
    data.forEach(function(item) {
      results.push(new Type(item.data));
    });
    
    cb(null, results);
  });
};

/**
 * RiakStorage#find(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Finds a single record in the database.
**/
RiakStorage.prototype.find = function(id, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;

  this.client.get(bucket, id, function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = createError("NotFound", 'No record found with the primaryKey "' + id + '".');
      }
      cb(e, undefined);
      return;
    }
    
    cb(null, new Type(data));
  });
};

/**
 * RiakStorage#where(args, filter, callback(e, result))
 * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
RiakStorage.prototype.where = function(args, filter, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;
  var result = [];

  filter = filter.toString();
  filter = filter.substring(filter.indexOf("{") + 1, filter.lastIndexOf("}"));
  args.__filter = filter;
  
  var filterRoutine = function(value, keyData, arg) {
    var record = riak.mapValuesJson(value)[0];
    var f = new Function("doc", "args", arg.__filter);
    return (f(record, arg)) ? [record] : [];
  };

  this.client.add(bucket).map(filterRoutine, args).run(function(e, docs) {
    if (e) {
      cb(e, undefined);
      return;
    }
    
    docs.forEach(function(doc, i) {
      docs[i] = new Type(doc);
    });
    
    cb(null, docs);
  });
};

/**
 * RiakStorage#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
RiakStorage.prototype.save = function(record, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;

  this.client.save(bucket, record[Type.primaryKey], record.toJSON(), function(e, data, meta) {
    if (e) {
      cb(e, undefined);
      return;
    }
    
    cb(null, record);
  });
};

/**
 * RiakStorage#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
RiakStorage.prototype.delete = function(record, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;
  
  this.client.remove(bucket, record[Type.primaryKey], function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = createError("NotFound", "Could not find a record to delete with primaryKey '" + record[primaryKey] + "'");
      }
      cb(e, undefined);
      return;
    }
    
    cb(null, record);
  });
};

module.exports = RiakStorage;
