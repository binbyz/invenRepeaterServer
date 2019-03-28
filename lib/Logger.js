'use strict';

/**
 * Logger Module <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-29
 */
var tools = require('./tools.js');

module.exports = function Logger() {

	/**
	 * Public
	 */
	return {

		/**
		 * 클라이어튼와 소통할 로그 오브젝트를 리턴
		 * @param  {[type]} message [description]
		 * @param  {[type]} type    [description]
		 * @param  {[type]} extends [description]
		 * @return {[type]}         [description]
		 */
		make: function(message, type, extend) {
			switch (type) {
				case 1:
					type = 'notice';
					break;
				case 2:
					type = 'backend';
					break;
				case 3:
					type = 'PONG';
					break;
				default:
					type = type;
					break;
			}

			extend = extend || {};

			return {
				type		: type,
				message	: message,
				timestamp: tools.timestamp(),
				datetime	: tools.logTime('plain'),
				vars		: extend
			}
		}

	};
}