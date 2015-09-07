var MSSQLStream = require('./..');


console.log(MSSQLStream);

var dbConfig = {
  user: '',
  password: '',
  port: 1433,
  server: '',
  database: ''
};


var tableConfig = {
  name: '[dbo].[table1]',
  uniqueColumn: 'myid'
};


var tableConfig2 = {
  name: '[dbo].[table2]',
  uniqueColumn: 'id'
};




// for 1
var mssqlStream = new MSSQLStream(dbConfig, tableConfig);
console.log(mssqlStream.tableConfig);

mssqlStream.on('error', function(err) {
  console.log("err:" + err);
});

mssqlStream.on('row', function(row) {
  console.log(row[tableConfig.uniqueColumn]);
  mssqlStream.pause();
  setTimeout(function() {
    console.log('in timeout:' + row[tableConfig.uniqueColumn]);
    mssqlStream.resume();
  }, 100);
});

mssqlStream.on('end', function(info) {
  console.log("fetch end");
  console.log('info:' + info);
});
