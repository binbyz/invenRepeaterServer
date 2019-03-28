'use strict';

/**
 * Database <byzz@inven.co.kr>
 *
 * asynchronize to synchronize 
 * # http://jckim0414.com/node-js-change-function-async-sync/
 * 
 * last modified: 2015-10-15
 */

var tools = require('./tools.js'),
	 mysql = require('mysql'),
	 sprintf = tools.getInstance('sprintf'),
	 _ = tools.getInstance('underscore');

module.exports = function Database(_dbname) {
	var _host = config.database.host,
		_user = config.database.user,
		_pass = config.database.pass,
		__dbn = _dbname;

	var _db = null
		, _where = []
		, _fields = '*'
		, _table = null
		, _orderby = null
		, _sqlQuery = null;

	/**
	 * [_connect description]
	 * @return {[type]} [description]
	 */
	function _connect() {
		_db = mysql.createConnection({
			host: _host,
			user: _user,
			password: _pass,
			database: __dbn,
			debug: config.database.debug,
			chatset: config.database.charset
		});

		try {
			_db.connect(function(err) {
				if (err) {
					tools.debug("Database connecting error.", err.stack);
				}

				tools.log("Database connect ThreadId#"+_db.threadId)
			});

			// sync(_db, 'query');

			// issue#1
			// date: 2015-07-15
			// http://stackoverflow.com/questions/20210522/nodejs-mysql-error-connection-lost-the-server-closed-the-connection

			_db.on('error', function(err) {
				tools.debug('_db error', null);

				if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
					tools.log("Database reconnect...");
					_connect(); // lost due to either server restart, or a
				} else { // connnection idle timeout (the wait_timeout
					throw err; // server variable configures this)
				}
			});

			return true;
		} catch(e) {
			tools.debug('Database connection failure.', e);
			return false;
		}
	}

	/**
	 * [_operator description]
	 * @param  {[type]} operator [description]
	 * @return {[type]}          [description]
	 */
	function _operator(operator) {
		switch (operator) {
			case '=':
			case 'equal':
				return '=';
				break;
			case 'lgt':
			case '>=':
				return '>=';
				break;
			case 'lt':
			case '<=':
				return '<=';
				break;
			default:
				return false;
		}
	}

	/**
	 * [stripslashes description]
	 * @param  {[type]} str [description]
	 * @return {[type]}     [description]
	 */
	function stripslashes(str) {
	  return (str + '')
	    .replace(/\\(.?)/g, function(s, n1) {
	      switch (n1) {
	        case '\\':
	          return '\\';
	        case '0':
	          return '\u0000';
	        case '':
	          return '';
	        default:
	          return n1;
	      }
	    });
	}

	/**
	 * [_query description]
	 * @param  {[type]} cnt [description]
	 * @return {[type]}     [description]
	 */
	function _query(type, limit) {
		// enabled asynchronize to synchronize
		_sqlQuery = _sql(type, null, limit);

		var tmp;
		
		_db.query(_sqlQuery, function(err, rows) {
			tmp = rows;
		});

		return tmp;
	}

	/**
	 * [_sql description]
	 * @return {[type]} [description]
	 */
	function _sql(type, values, limit) {
		if (!_db || !_table) return false;

		type = type.toLowerCase();
		var sql = "";

		// select, update, insert and delete
		switch (type) {
			/**************************
			 * SELECT
			 **************************/
			case 'select':
				sql = "SELECT "+_fields+" FROM `"+_table+"`";

				var clause = []
					, cur = null
					, value = null;

				if (_where.length>0) {
					for (var idx=0, len=_where.length; idx<len; idx++) {
						cur = _where[idx];

						if (typeof cur.value == 'string') {
							value = '"'+cur.value+'"';
						}else if (typeof cur.value == 'number') {
							value = cur.value;
						}

						clause.push('(`'+cur.field+'`'+_operator(cur.operator)+value+')');
					}
				}

				if (clause.length>0){
					sql = sql + " WHERE " + clause.join(' AND ');
				}
				if (_orderby) {
					sql = sql + " ORDER BY " +_orderby;	
				}
				if (limit) {
					sql = sql + " LIMIT "+limit;
				}
				sql += ';';
				return sql;
				break;
			/***************************
			 * INSERT
			 **************************/
			case 'insert':
				if (values && _.isObject(values)) {
					sql = sprintf("INSERT INTO `"+_table+"`(%s) VALUES(%s)", 
										_.keys(values).join(','),
										_.map(_.values(values), function(val) {
											return "'"+stripslashes(val)+"'";
										}).join(',')
									);
					return sql;
				}else{
					tools.debug(values);
					return false;
				}
				break;
			/***************************
			 * ETC
			 **************************/
			case 'lifecycle':
				return "SELECT 1+1 AS `lifecycle`;";
				break;
		}
	}

	/**
	 * 접속 유실 방지
	 */
	function _connLossless() {
		setInterval(function() {
			// tools.log('Database LifeCycle Quering');
			_query('lifecycle');
		}, 600000);
	}

	_connect();
	_connLossless();

	/**
	 * Public Methods
	 */
	return {

		/**
		 * 데이터베이스 연결
		 * @param  String _dbn 데이터베이스명
		 * @return Boolean	디비연결 성공여부
		 */
		connection: function(_dbn) {
			if (_dbn) {
				__dbn = _dbn;
			}

			_connect();
		},

		/**
		 * [reset description]
		 * @return {[type]} [description]
		 */
		clear: function() {
			_where 		= [];
			_fields 		= '*';
			_table 		= null;
			_sqlQuery 	= null;
			_orderby 	= null;
		},

		/**
		 * 가져올 필드
		 * @param  {[type]} fields [description]
		 * @return {[type]}        [description]
		 */
		fields: function(fields) {
			_fields = fields;
		},

		/**
		 * [where description]
		 * @param  {[type]} field [description]
		 * @param  {[type]} value [description]
		 * @return {[type]}       [description]
		 */
		where: function(field, value, operator) {
			if (!operator) operator = 'equal';

			_where.push({
				field: field,
				value: value,
				operator: operator
			});

		},

		/**
		 * [orderby description]
		 * @param  {[type]} orderby [description]
		 * @return {[type]}         [description]
		 */
		orderby: function(orderby) {
			_orderby = orderby;
		},

		/**
		 * [getOne description]
		 * @param  {[type]} table [description]
		 * @return {[type]}       [description]
		 */
		getOne: function(table, callback) {
			_table = table;
			_sqlQuery = _sql('SELECT', null, 1);

			_db.query(_sqlQuery, function(err, rows) {
				if (typeof rows !=='undefined' && rows.length>0)
					callback(rows);
			});
		},

		/**
		 * [fetchAll description]
		 * @param  {[type]} table [description]
		 * @return {[type]}       [description]
		 */
		fetchAll: function(table, callback) {
			_table = table;
			_sqlQuery = _sql('SELECT', null, null);

			_db.query(_sqlQuery, function(err, rows) {
				if (typeof rows !=='undefined' && rows.length>0)
					callback(rows);
			});
		},

		/**
		 * [insert description]
		 * @param  {[type]}   table    [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		insert: function(table, values, callback) {
			_table = table;
			_sqlQuery = _sql('INSERT', values, null);

			_db.query(_sqlQuery, function(err) {
				if (!err) {
					if (typeof callback==='function') callback();
				}else{
					tools.debug(err);
				}
			});
		},

		/**
		 * [getInstance description]
		 * @return {[type]} [description]
		 */
		getInstance: function() {
			return instance;
		},

		/**
		 * [getThreadId description]
		 * @return {[type]} [description]
		 */
		getThreadId: function() {
			return _db.threadId;
		}
	};
};