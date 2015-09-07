require('mocha');
var should = require('should');
var MSSQLStream = require('./..');

describe('mssql', function() {

  describe('it should emit error', function() {
    it('dbConfig is not defined ', function(done) {
      var mssqlStream = new MSSQLStream();
      mssqlStream.on('error', function(err) {
        // console.log(err);
        done();
      })
    });

    it('tableConfig is not defined ', function(done) {
      var dbConfig = {};
      var mssqlStream = new MSSQLStream(dbConfig);
      mssqlStream.on('error', function(err) {
        // console.log(err);
        done();
      })
    });
  });

  describe('_nextRow test', function() {
    it('should emit "row" when this.rows has data', function(done) {
      var testData1 = [{
        a: 'a1',
        b: 'b1'
      }, {
        a: 'a2',
        b: 'b2'
      }, {
        a: 'a3',
        b: 'b3'
      }];
      var mssqlStream = new MSSQLStream();
      mssqlStream.rows = [{
        a: 'a1',
        b: 'b1'
      }, {
        a: 'a2',
        b: 'b2'
      }, {
        a: 'a3',
        b: 'b3'
      }];

      mssqlStream.on('error', function(err) {
        // console.log(err);
      });
      mssqlStream.on('row', function(row) {

        if(row['a'] === 'a3') {
          done();
        }
      });
      setImmediate(function() {
        mssqlStream.resume();
      });

    });


  });

  describe('pause test', function() {
    it('after pause() this.isPaused should equal false', function(done) {
      var mssqlStream = new MSSQLStream();
      mssqlStream.on('error', function(err) {
        // console.log(err);
      });
      mssqlStream.pause();
      mssqlStream.isPaused.should.equal(true);
      done();
    });

  });

  describe('resume test', function() {
    it('after resume() this.isPaused should equal true', function(done) {
      var mssqlStream = new MSSQLStream();
      mssqlStream.on('error', function(err) {
        // console.log(err);
      });
      mssqlStream.resume();
      mssqlStream.isPaused.should.equal(false);
      done();
    });
  });

  describe('_iterator test', function() {
    it('after _iterator() it should emit the error "_ierator error:" ', function(done) {
      var mssqlStream = new MSSQLStream();
      mssqlStream.tableConfig = {
        name: '[dbo].[testTable]',
        uniqueColumn: 'myId'
      };
      mssqlStream.dbConfig = {
        user: 'youruser',
        password: 'yourpass',
        port: 1433,
        server: '192.168.1.1',
        database: 'yourdb'
       };
      this.timeout(20000);
      mssqlStream.on('error', function(err) {
        // console.log(err);
      });
      mssqlStream._iterator(function(err) {
        // console.log(err);
        (!!err).should.be.ok;
        done();
      });
    });
  });
});
