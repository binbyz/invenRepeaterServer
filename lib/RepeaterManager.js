'use strict';

/**
 * RepeaterManager <byzz@inven.co.kr>
 *
 * 리피터 객체를 통합적으로 관리하기 위함
 * 
 * last modified: 2015-07-27
 */
var tools = require('./tools.js'),
	_ = tools.getInstance('_');

module.exports = function RepeaterManager(_opts_, repeaters) {
	var _rptArr = [];
	var _token = null;


	/**
	 * 리피터들을 관리 배열에 담음
	 * @param  {[type]} one [description]
	 * @return {[type]}     [description]
	 */
	function _push(repeater) {
		_rptArr.push({
			id: repeater.getId(),
			start: tools.timestamp(),
			_instance: repeater
		});
	}

	/**
	 * [_startAll description]
	 * @return {[type]} [description]
	 */
	function _startAll(token) {
		_.each(_rptArr, function(repeater) {
			repeater._instance.start(token);
		});
	}

	function _ready() {
		_.each(_rptArr, function(repeater) {
			repeater._instance.ready();
		});
	}

	if (repeaters.length>0) {
		_.each(repeaters, function(repeater) {
			_push(repeater);
		});
	}

	/**
	 * Public Methods
	 */
	return {
		/**
		 * 리피터 일괄 시작 명령어
		 * 
		 * @TODO: opts.exception, opts.ids 옵션 줄수 있게끔 구현
		 * 
		 * @param  {[type]} opts [description]
		 * @return {[type]}      [description]
		 */
		start: function(opts, token) {
			var parent = this;
			if (!token) token = _token;

			if (!opts) _startAll(token);
			if (_.isArray(opts)) {
				_.each(opts, function(id) {
					parent.get(id).start(token);
				});
			}
		},

		/**
		 * 리피터 일괄 중단 명령어
		 * 
		 * @TODO : opts.exception, opts.ids
		 * 
		 * @param  {[type]} opts [description]
		 * @return {[type]}      [description]
		 */
		ready: function(opts) {
			if (!opts) _ready();
		},

		/**
		 * 리피터 추가
		 * @param {[type]} repeater [description]
		 */
		add: function(repeater) {
			if(!RepeaterManager.is(repeater.getId())) {
				_rptArr.push(repeater);
			}else{
				return false;
			}
		},

		/**
		 * 주어진 아이디로 리피터가 있는지 검사
		 * @param  {[type]}  id [description]
		 * @return {Boolean}    [description]
		 */
		is: function(id) {
			if (_.findWhere(_rptArr, {id:id})) {
				return true;
			}else{
				return false;
			}
		},

		/**
		 * 웹 로그인 토큰
		 * @param {[type]} token [description]
		 */
		setToken: function(token) {
			_token = token;
		},

		/**
		 * 리피터 객체를 돌려줌
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		get: function(id) {
			return (_.findWhere(_rptArr, { id: id }))._instance;
		},

		/**
		 * 해당 객체의 아이디를 삭제함
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		delete: function(id) {
			_rptArr = _.without(_rptArr, _.findWhere(_rptArr, {id: id}));
		},

		size: function() {
			return _rptArr.length;
		},

		debug: function() {
			tools.debug(_rptArr);
		}
	}

}