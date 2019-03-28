'use strict';

/**
 * Repeater <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-20
 */
var tools 		= require('./tools.js')
	, async 		= require('async')
	, request 	= require('request')
	, moment 	= tools.getInstance('moment')
	, _ 			= tools.getInstance('_')
	, validUrl 	= tools.getInstance('valid-url')
	, xml2js		= tools.getInstance('xml2js')
	, parser		= xml2js.Parser();

module.exports = function Repeater(_opts_, db, id) {
	if (!id) id = 'common';

	var _id = id // 리피터 식별 아이디
		, db = db
		, _dataSet = null
		, _pause = false
		, _first = true
		, _nextBegins = {}
		, _nextBegins = { 
			'1': { taskHolding: false, delay: 3000 },
  			'2': { taskHolding: false, delay: 5000 },
  			'3': { taskHolding: true, delay: 4000 } 
  		}
		, _timer
		, _token
		, _status = 0; // 0=stop, 1=ready, 2=start

	/**
	 * [_makeRepeater description]
	 * @param  {[type]} repData [description]
	 * @return {[type]}         [description]
	 */
	function _makeRepeater(repData) {
		var taskInfor = (_nextBegins[repData.idx]) ? _nextBegins[repData.idx] : null;
		var seconds = null, executable = false;

		if (_.isObject(taskInfor)) {
			if (taskInfor.taskHolding === true) executable = false;
			else executable = true;

			if (taskInfor.delay>0) {
				seconds = taskInfor.delay;
			}
		}else{
			seconds = 0; // immediately execute
			executable = true;
		}

		+(function(executable, seconds) {
			setTimeout(function() {
				tools.debug(">>>", executable);

				if (executable===true) {
					// _request(repData, function(isSuccess) {
					// });
					console.log(repData.idx);
					console.log(repData.title);
					console.log(seconds);
					console.log('======================');
				}
				
				_makeRepeater(repData);
			}, seconds);
		})(executable, seconds);
	}

	/**
	 * [_request description]
	 * @param  {[type]}   repData  [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	function _request(repData, callback) {
		if (validUrl.isUri(repData.xml)) {
			var headers = {
				"Pragma": "no-cache",
				"Cache-Control": "no-cache",
				"Cookie": _token
			};

			request(
				{
					url: repData.xml,
					method: "GET",
					headers: headers
				}, 
				function(error, response, xmldoc) {
					if (!error && response && response.statusCode == 200) {
						tools.notice("\""+repData.title+"\""+" was successfully requested.");

						parser.parseString(xmldoc, function (error, xmlDoc) {
							var rCode = Math.floor(xmlDoc.resultdata.resultcode/100)*100;

							switch (rCode) {
								case 100:
								case 200:
									_nextBegins[repData.idx] = {
										taskHolding	: false,
										delay			: Math.floor(xmlDoc.resultdata.delay) * 1000 // next interval time
									};
									break;
								case 400:
									_nextBegins[repData.idx] = {
										taskHolding	: true,
										delay			: -1 // stop
									};
									break;
							}
						});
					}else if(response && response.statusCode == 404){
						tools.debug("\""+repData.title+"\""+" Page Not Found. (STATUS CODE:"+response.statusCode+")");

						_nextBegins[repData.idx] = {
							taskHolding	: true,
							delay			: -1
						};
					}else{
						tools.debug("\""+repData.title+"\""+" was not succeed. (STATUS CODE:"+response.statusCode+")");
						tools.debug(token);

						_nextBegins[repData.idx] = {
							taskHolding	: true,
							delay			: -1
						};
					}

					callback((response.statusCode==200)?true:false);
				}
			); // end request scope
		}else{
			tools.debug("Not validate url", repData);
		}
	}

	/**
	 * [_start description]
	 * @param  {[type]} token [description]
	 * @return {[type]}       [description]
	 */
	function _start() {
		_.each(_dataSet, function(repData) {
			_makeRepeater(repData);
		});
	}

	/**
	 * 기타 데이터 변환 
	 */
	function _reform() {
		if (_dataSet.length>0) {
			_.each(_dataSet, function(res) { 
				// datetime reformat
				res.regdate = moment(res.regdate).format('YYYY-MM-DD HH:mm:ss');
				res.lastupdate = moment(res.lastupdate).format('YYYY-MM-DD HH:mm:ss');
			});
		}
	}

	/**
	 * Public Methods
	 */
	return {
		/**
		 * 리피터의 아이디
		 * @return {[type]} [description]
		 */
		getId: function() {
			return _id;
		},

		/**
		 * [ready description]
		 * @return {[type]} [description]
		 */
		ready: function() {
			var self = this;

			db.clear();
			db.fields('*');
			db.where('category', self.getId());
			db.fetchAll('rep_resource', function(datas) {
				if (datas) {
					_dataSet = datas;
					_reform();
					_status = 1;
				}
			});

		},

		/**
		 * [start description]
		 * @return {[type]} [description]
		 */
		start: function(token) {
			_pause = false;

			switch (_status) {
				case 0: // not ready
					tools.debug("Repeater|Not to ready [id:" + this.getId()+"]");
					break;
				case 1: // ready
					if (_first===true) {
						_token = token;
						_start();
						_first = false;
					}
					break;
			}
		},

		/**
		 * [pause description]
		 * @return {[type]} [description]
		 */
		pause: function() {
			_pause = true;
		},

		/**
		 * 현재 로드되어 있는 리피터 리스트들을 리턴함
		 * @return {[type]} [description]
		 */
		getDataset: function() {
			return _dataSet;
		}

	}

}