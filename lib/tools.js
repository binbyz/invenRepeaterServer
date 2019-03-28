'use strict';

/**
 * Tools <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-20
 */
 var md5 			= require('MD5');
 var fs 				= require('fs');
 var colors 		= require('colors');
 var moment 		= require('moment');
 var _ 				= require('underscore');
 var validUrl 		= require('valid-url');
 var cheerio		= require('cheerio');
 var querystring 	= require('querystring');
 var xml2js			= require('xml2js');
 var cpu				= require('cpu-stats');
 var sprintf		= require('sprintf');

 module.exports = {
 	/**
 	 * [timestamp description]
 	 * @return {[type]}
 	 */
 	timestamp: function() {
 		return moment().unix();
 	},

 	/**
 	 * [debug description]
 	 * @param  {[type]} message [description]
 	 * @return {[type]}         [description]
 	 */
 	debug: function(message, err) {
 		switch (typeof message) {
 			case 'object':
 				console.log(this.logTime() + "<Object>");
 				console.log(message);
 				break;
 			case 'string':
 			case 'number':
 			case 'undefined':
 				console.log(this.logTime() + colors.bgRed(message));
 				break;
 		}

 		if (err) console.log(err);
 	},

 	/**
 	 * [log description]
 	 * @param  {[type]} message [description]
 	 * @return {[type]}         [description]
 	 */
 	log: function(message) {
 		console.log(this.logTime() + message);
 	},

 	/**
 	 * [notice description]
 	 * @param  {[type]} message [description]
 	 * @return {[type]}         [description]
 	 */
 	notice: function(message) {
 		console.log(this.logTime() + colors.bgBlue(message));
 	},

 	/**
 	 * Deprecated
 	 * 
 	 * @param  {[type]}
 	 * @return {[type]}
 	 */
 	toTime: function(timestamp) {
 		if( !timestamp ) timestamp = this.timestamp();

 		var date = new Date(timestamp + 1000);
 		return date.getFullYear() + "-" + 
 				("0" +(date.getMonth() + 1)).slice(-2) + 
 				"-" + ("0" + date.getDate()).slice(-2) +
 				" " + 
 				date.getHours() + ":" + 
 				date.getMinutes() + ":" + 
 				date.getSeconds();
 	},

 	/**
 	 * example: [2015-03-16 12:00:00]
 	 * @return {string}
 	 */
 	logTime: function(type) {
 		switch (type) {
 			case 'plain':
 				return moment().format('YYYY-MM-DD HH:mm:ss');
 				break;
 			default:
 				return colors.inverse("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]") + " ";
 		}
 	},

 	/**
 	 * Returns a random integer between min (inclusive) and max (inclusive)
 	 * Using Math.round() will give you a non-uniform distribution!
 	 */
 	getRandomInt: function(min, max) {
 		return Math.floor(Math.random() * (max - min + 1)) + min;
 	},

 	/**
 	 * [makeUniqRoom description]
 	 * @return {string} [description]
 	 */
 	makeUniqId: function() {
 		return md5( this.timestamp() + getRandomInt(1, 9999) );
 	},

 	/**
 	 * [require_once description]
 	 * @return {[type]} [description]
 	 */
 	require_once: function(file) {
 		fs.readFile( file, function(err, data) {
 			if( err )
 				throw err;
 			console.log( data.toString() );
 		});
 	},

 	/**
 	 * [delay description]
 	 * @param  {Function} callback [description]
 	 * @param  {[type]}   delay    [description]
 	 * @return {[type]}            [description]
 	 */
 	delay: function(callback, delay) {
 		setTimeout(function() {
 			callback();
 		}, (delay>0)?delay:1500);
 	},

 	/**
 	 * [getInstance description]
 	 * @param  {[type]} module [description]
 	 * @return {[type]}        [description]
 	 */
 	getInstance: function(module) {
 		switch (module) {
 			case '_':
 			case 'underscore':
 				return _;
 				break;
 			case 'valid-url':
 				return validUrl;
 				break;
 			case 'moment':
 				return moment;
 				break;
 			case 'colors':
 				return colors;
 				break;
 			case 'moment':
 				return moment;
 				break;
 			case 'qs':
 			case 'querystring':
 				return querystring;
 				break;
 			case 'cheerio':
 			case 'dom':
 			case 'jquery':
 				return cheerio;
 				break;
 			case 'xml2js':
 				return xml2js;
 				break;
 			case 'cpu':
 				return cpu;
 				break;
 			case 'sprintf':
 				return sprintf.sprintf;
 				break;
 			case 'vsprintf':
 				return sprintf.vsprintf;
 				break;
 			// case 'mysql':
 			// 	return mysql;
 			// 	break;
 			default:
 				return null;
 		}
 	}

 };