'use strict';

/**
 * AddrManager <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-27
 */
var tools = require('./tools.js');

module.exports = function AddrManager(_opts_) {
	return {
		/**
		 * 클라이언트 배열
		 */
		clients: [],

		/**
		 * 아이피 접속 제한 
		 * @param  {[type]}  clientAddr [description]
		 * @return {Boolean}            [description]
		 */
		isAccessAllow: function(clientAddr) {
			var arr = clientAddr.trim().split('.');

			// ipv4
			if (arr.length != 4) return false;

			// class
			var rAddr = /125\.141\.60\.[0-9]{1,3}|127\.0\.0\.1|localhost|::1/;

			if (rAddr.test(clientAddr)) {
				return true;
			}else{
				return false;
			}
		},

		/**
		 * 아이피로 해당 클라이언트가 있는지 확인
		 * @param  {[type]}  addr [description]
		 * @return {Boolean}      [description]
		 */
		is: function(addr) {
			for(var client in this.clients) {
				if (client.addr == addr) return true;
			}

			return false;
		},

		/**
		 * 접속한 클라이언트를 관리함
		 * @param {[type]} addr [description]
		 * @param {[type]} id   [description]
		 */
		addClient: function(addr, id) {
			if (!addr) return false;
			if (!id) id = null;

			if (!this.is(addr)) {
				this.clients.push({
					addr: addr,
					id: id,
					connection_time: tools.timestamp()
				});

				// console.log(this.clients);
				return true;
			}else{
				for(var client in this.clients) {
					if (this.clients[client].addr == addr) {
						this.clients[client].id = id;
						return true;
					}
				}

				return false; // can't find client
			}

		},

		/**
		 * 클라이언트를 삭제함
		 * @param  {[type]} addr [description]
		 * @param  {[type]} id   [description]
		 * @return {[type]}      [description]
		 */
		deleteClient: function(addr, id) {
			for (var client in this.clients) {
				// tools.debug("here", this.clients[client]);

				if (this.clients[client].addr == addr) {
					if (!id) this.clients.pop(client); // delete object
					else this.clients[client].id = null; // delete id
				}
			}
		}
	}
}