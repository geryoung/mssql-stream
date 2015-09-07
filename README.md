MSSQLStream.js 
========


[![Build Status](https://travis-ci.org/geryoung/mssql-stream.svg?branch=master)](https://travis-ci.org/geryoung/mssql-stream)

## back-pressure in node-mssql
[mssql issure Back pressure? #67](https://github.com/patriksimek/node-mssql/issues/67)

when use [node-mssql](https://github.com/patriksimek/node-mssql) to traverse a table of MSSQL Server database, you may face the `back-pressure` problem if data is very big. `node-mssql` does not support the pause and resume in stream now. 


## why mssqlstream
use `mssqlstream` you can fetch all the data row by row, with pause and resume.
when the row is coming, pause the stream, after comsume the row, resume the stream in a callback or resume the stream direct.

## how to use mssqlstream
1. it is not a real stream, and there are about 1000 rows cached.
2. the table must have a (unique and int) field.
3. `mssqlstream` is only support fetch all the data from table, 'SELECT WHERE' or other queries is not supported.

## what is in mssqlstream
1. get the range of (unique and int) field.
2. fetch first 1000 rows by specific the (unique and int) field.
3. after these 1000 rows consumed, fetch next 1000 rows
4. until no more rows left, done.
  


API
====
## Constructor
```javascript
/**
 * @param {[Object]} dbConfig config for node-mssql connection   
  {
      user: 'youruser',
      password: 'yourpass',
      port: 1433,
      server: '192.168.1.1',
      database: 'yourdb'
   }
 * @param {[Object]} tableConfig specific the table and (unique and int) field name
   {
    name: '[dbo].[test_table]',
    uniqueColumn: 'myid'
   }
 */
var mssqlStream = new MSSQLStream(dbConfig, tableConfig);
```

## Methods

### mssqlStream.pause()
pause the stream, MSSQLStream will not return new rows, until calling the resume().

### mssqlStream.resume()
resume the stream

## Events
### 'row'
return a row 

```javascript
mssqlStream.on('row', function(row) {
  //To-Do  
});
```
### 'error' 
return error info

```javascript
mssqlStream.on('error', function(errorInfo) {
    //To-Do
})
```

### 'end' 
all rows has been fetched

```javascript
mssqlStream.on('end', function() {
  //To-Do
});
```

Use
====

```javascript
var MSSQLStream = require('mssqlstream');

var dbConfig = {
  user: 'youruser',
  password: 'yourpass',
  port: 1433,
  server: '192.168.1.1',
  database: 'yourdb'
};


var tableConfig = {
  // specific the table 
  name: '[dbo].[test_table]',
  // specific the (unique and int) field 
  uniqueColumn: 'myid'
};


var mssqlStream = new MSSQLStream(dbConfig, tableConfig);

mssqlStream.on('error', function(err) {
  console.log("err:" + err);
});

mssqlStream.on('row', function(row) {
  console.log(row[tableConfig.uniqueColumn]);

  //pause the stream
  mssqlStream.pause();

  //use setTimeout to simulate the data processing 
  setTimeout(function() {
    console.log('in timeout:' + row[tableConfig.uniqueColumn]);

    //done, resume the stream
    mssqlStream.resume();
  }, 100);
});

mssqlStream.on('end', function(info) {
  console.log("fetch end");
  console.log('info:' + info);
});
```

Test
=====
Run `npm install`
Run `npm test`



License
=====
WTFPL License.