'use strict';

/**
 * WebLogin 0.0.1 <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-19
 */
var tools 		= require('./tools.js')
	, request	= require('request')
	, async		= require('async')
	, cheerio 	= tools.getInstance('cheerio')
	, qs 			= tools.getInstance('querystring')
	, _ 			= tools.getInstance('_');

module.exports = function WebLogin(db) {
	var _cookie 	= null;
	var _auth 		= null;
	var db 			= db;

	var _hex2bin = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ];

	function hex2bin(str) {
		 var len = str.length;
		 var rv = '';
		 var i = 0;
		 var c1;
		 var c2;
		 while (len > 1) {
			h1 = str.charAt(i++);
			c1 = h1.charCodeAt(0);
			h2 = str.charAt(i++);
			c2 = h2.charCodeAt(0);
			rv += String.fromCharCode((_hex2bin[c1] << 4) + _hex2bin[c2]);
			len -= 2;
		 }

		 return rv;
	}

	function bin2hex(s) {
		 var i, l, o = '',
			  n;
		 s += '';
		 for (i = 0, l = s.length; i < l; i++) {
			  n = s.charCodeAt(i).toString(16);
			  o += n.length < 2 ? '0' + n : n;
		 }
		 return o;
	}

	/**
	 * 필요한 쿠키만 걸러냄
	 */
	function _tokenize(token) {
		var rfrm_cks = [];

		_.each(token, function(one) {   
			_.each(one.split(';'), function(cookies) {
				var tmp = cookies.split('=');
				var key = tmp[0];
				var val = tmp[1];
				  
				switch (key) {
					case 'M_INV':
					case 'M_ID':
					case 'M_SID':
						if (val!='deleted') {
							rfrm_cks.push(key+"="+val);
						}
						break;
				  }
			 });
		});

		return (rfrm_cks.length>0) ? rfrm_cks.join(';') : null;
	}

	function _saveToken(tokens) {
		_auth = _tokenize(tokens);

		db.clear();
		db.insert('rep_session', {session: _auth});
	}

	;(function() {
		db.clear();
		db.orderby('idx desc');
		db.getOne('rep_session', function(one) {
			_auth = one[0].session;
		});
	})();

	/**
	 * Public Methods
	 */
	return {

		/**
		 * [login description]
		 * @param  {[type]} pId       [description]
		 * @param  {[type]} pPassword [description]
		 * @param  {[type]} fianlCb 	콜백메서드
		 * @return {[type]}           [description]
		 */
		login: function(pId, pPassword, finalCb) {
			if (!finalCb || typeof finalCb === 'undefined') {
				finalCb = function() {};
			}

			async.waterfall([
				function (callback) {
					request('http://www.inven.co.kr/webzine/', function(error, response, body) {
						if (!error && response.statusCode == 200) {
							var $ = cheerio.load(body);
							var code = $('#inven-verification').attr('content');

							if (code) {
								callback(null, code);
							}
						}
					});
				},
				function (verifyCode, callback) {
					request({
						method: 'POST',
						url: "https://member.inven.co.kr/user/scorpio/mlogin",
						referer: "http://www.inven.co.kr/webzine/",
						form: {
							url: "http://www.inven.co.kr/webzine/",
							weblogin: verifyCode
						}
					}, function(error, response, body) {
						if (!error && response.statusCode == 200) {
							var $ = cheerio.load(body);
							var stoken = $('#stoken').val();
							var wsip = $('#wsip').data('json');

							if (stoken && wsip) {
								callback(null, stoken, wsip, response.headers['set-cookie']);
							}
						}
					});
				},
				function (stoken, wsip, sessCookie, callback) {
					var formData = {
						"user_id"	: pId,
						"password"	: pPassword,
						"kp"			: 0,
						"st"			: stoken,
						"wsip"		: wsip
					};

					var headers = {
						"Pragma": "no-cache",
						"Cache-Control": "no-cache",
						"Cookie": sessCookie.join(';'),
						"Content-Length": qs.stringify(formData).length
					};

					request({
						url: 'https://member.inven.co.kr/m/login/dispatch',
						method: 'POST',
						headers: headers,
						form: formData
					}, function (error, response, body) {
						if (response.error) {
							tools.debug(response.error);
						}else{
							callback(null, response.headers);
						}
					});
				},
				function (headers, callback) {
					if (headers['set-cookie']) {
						callback(null, headers['set-cookie']);
					}
				},
				function (cookies, callback) {
					_saveToken(cookies);
					callback(null);
				}
			], finalCb);
		},

		/**
		 * [getToken description]
		 * @return {[type]} [description]
		 */
		getToken: function() {
			return _auth;
		},

		/**
		 * [getLastToken description]
		 * @return {[type]} [description]
		 */
		getLastToken: function() {
			return _auth;
		},

		/**
		 * [isLogin description]
		 * @return {Boolean} [description]
		 */
		isLogin: function() {
			if (_auth) return true;
			else return false;
		}

	}

}