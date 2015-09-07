var mssql = require('mssql');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


var MSSQLStream = function(dbConfig, tableConfig) {
  var that = this;

  that.rows = [];
  that.range = {
    startId: 0,
    endId: 0
  };

  that.dbConfig = dbConfig;
  that.tableConfig = tableConfig;

  that.perFetchNum = 10;
  
  that.currentId = 0;
  that.total = 0;
  that.currentCount = 0;
  that.isPaused = false;
  that.uniqueColumn = 'id';

  that.fetchSqlTmp = "SELECT * from {table} WHERE {uniqueColumn} >= {left} AND {uniqueColumn} <= {right};";
  that.countSqlTmp = "SELECT count(*) as total, MAX({uniqueColumn}) as maxId, MIN({uniqueColumn}) as minId FROM {table};";
  
  setImmediate(function() {
    that._init();
  });
};

util.inherits(MSSQLStream, EventEmitter);


MSSQLStream.prototype._init = function() {
  var that = this;
  if(!that.dbConfig) {
    that.emit('error', 'dbConfig is not defined');
    return;
  }

  //_init for the
  var connection = new mssql.Connection(that.dbConfig, function(err) {
    if(err) {
      that.emit('error', 'connection error:' + err);
      return;
    }

    var request = new mssql.Request(connection);
    var validateTableConfig = that.tableConfig && 
                              that.tableConfig.uniqueColumn && 
                              that.tableConfig.name;


    if( !validateTableConfig ) {
      
      that.emit('error', 'tableConifg is wrong');
      return;
    }

    var countSql = that.countSqlTmp.
                      replace('{table}', that.tableConfig.name).
                      replace(/{uniqueColumn}/g, that.tableConfig.uniqueColumn);
    
    request.query(countSql, function(err, rows) {
      if(err) {
        that.emit('error', 'query error:' + err);
        return;
      }

      var validaterows= rows && 
                        rows.length &&
                        'maxId' in rows[0] &&
                        'minId' in rows[0] &&
                        'total' in rows[0];

      if( !validaterows ) {
        that.emit('error', 'get table state err, sql:' + countSqlTmp + ', result:' + JSON.stringify(rows, null, ' '));
        return;
      }

      that.total = rows[0].total;
      that.range.endId = rows[0].maxId;
      that.range.startId = rows[0].minId;


      setImmediate(function() {
        that._nextRow();  
      });
    });

  });

};

MSSQLStream.prototype._nextRow = function() {
  var that = this;
  if(that.isPaused) {
    return;
  }

  var hasRows = that.rows && that.rows.length;
  if(hasRows) {
    var row = that.rows.shift();
    that.emit('row', row);

    setImmediate(function() {
      that._nextRow();
    });
    return;
  }

  that._iterator(function(err, rows) {
    if(err) {
      that.emit('error', '_ierator error:' + err + ', currentId=' + that.currentId);
      return;
    }

    that.rows = rows;
    
    setImmediate(function() {
      that._nextRow();
    });
  }); 

};  

MSSQLStream.prototype._iterator = function(callback) {
  var that = this;
  var leftId = that.currentId;
  
  if(leftId > that.range.endId) {
    that._end();
    return;
  }
  var rightId = leftId + that.perFetchNum-1;
  var fetchSql = that.fetchSqlTmp.
                  replace('{table}', that.tableConfig.name).
                  replace(/{uniqueColumn}/g, that.tableConfig.uniqueColumn).
                  replace('{left}', leftId).
                  replace('{right}', rightId);
  
  var connection = new mssql.Connection(that.dbConfig, function(err) {
    if(err) {
      callback(err);
      return;
    }
    var request = new mssql.Request(connection);
    request.query(fetchSql, function(err, rows) {
      if( err ) {
        callback(err);
        return;
      }

      that.currentId = rightId+1;

      if( rows && rows.length ) {
        callback(null, rows);
        return;
      }
      
      that._iterator(callback);
    });
  }); 
};


MSSQLStream.prototype.pause = function() {
  this.isPaused = true;
};

MSSQLStream.prototype.resume = function() {
  var that = this;
  that.isPaused = false;
  setImmediate(function() {
    that._nextRow();
  });
};

MSSQLStream.prototype._end = function() {
  this.emit('end', 'all data is fetch' );
};

module.exports = MSSQLStream;