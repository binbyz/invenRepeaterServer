'use strict';

global.config 	= require('./config');

/**
 * Repeater<main> <byzz@inven.co.kr>
 * 
 * last modified: 2015-10-30
 *
 * <실행옵션>
 * 	-monitor: 주고받는 요청을 콘솔에 출력합니다.
 * 	
 */
var io 				 	= require('socket.io').listen(config.socketio.port),
	express				= require('express'),
	tools 			 	= require('./lib/tools.js'),
	Database 		 	= require('./lib/Database.js'),
	WebLogin				= require('./lib/WebLogin.js'),
	AddrManager 	 	= require('./lib/AddrManager.js'),
	RepeaterManager  	= require('./lib/RepeaterManager.js'),
	Repeater 		 	= require('./lib/Repeater.js'),
	Logger 		 		= require('./lib/Logger.js'),
	async					= require('async'),
	DB 					= new Database(config.database.dbname),
	webLogin 			= new WebLogin(DB),
	addrManager 		= new AddrManager(_opts_),
	logger 				= new Logger(),
	_opts_ 				= [],
	_ 						= tools.getInstance('_'),
	cpu					= tools.getInstance('cpu'),
	sprintf				= tools.getInstance('sprintf'),
	app 					= express();

if (process.argv.length>2) {
	var rArgv = /\-(monitor)/i;
	for (var idx=0, len=(process.argv.length-2); idx<len; idx++) {
		var cursor = idx+2,
			options = rArgv.exec(process.argv[cursor]),
			option = null;

		if (options.length>0) {
			option = options[1];
			_opts_[option] = true;
		}
	}
}

tools.log("Repeater Server");

/**
 * Repeater
 */
var repeaterManager = new RepeaterManager(_opts_, [
	new Repeater(_opts_, DB, 'common')
]);

repeaterManager.ready();

/**
 * WebLogin to http://www.inven.co.kr/
 */
// webLogin.login(config.weblogin.id, config.weblogin.password, function() {
// 	// execute code when login was finished
// 	// repeaterManager.setToken(webLogin.getToken());
// });
tools.delay(function() {
	repeaterManager.setToken(webLogin.getLastToken());
});

/**
 * Express
 */
app.locals.title = 'HTTP Repeater';

// middleware
app.use(function(req, res, next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	if (addrManager.isAccessAllow(ip)) {
		tools.log(sprintf("%s %s %s", ip, req.method, req.url));
		next();
	}else{
		res.status(404).sendFile(__dirname+config.express.notfound);
	}
});

app.use(function(req, res, next) {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Expires', '-1');
	res.header('Pragma', 'no-cache');
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accpet");
	next();
});

app.use('/public', express.static(__dirname+'/public'));

// GET /repeater/get/:rptid
app.get('/repeater/get/:rptid', function(req, res) {
	if (repeaterManager.is(req.params.rptid)) {
		res.send(repeaterManager.get(req.params.rptid).getDataset());
	}else{
		res.status(404).sendFile(__dirname+config.express.notfound);
	}
});

app.listen(config.express.port);

/**
 * socket.io server
 */
var nsp = io.of(config.socketio.namespace);

nsp.on('connection', function(socket) {
	if (addrManager.isAccessAllow(socket.handshake.address)) {
		tools.log(socket.handshake.address + " was connected.");
		addrManager.addClient(socket.handshake.address);

		nsp.emit('system', 
			logger.make("클라이언트("+socket.handshake.address+") 접속", 1, {status:'on'})
		);
	}else{
		tools.log(socket.handshake.address + " was blocked.");

		nsp.emit('system',
			logger.make("클라이언트("+socket.handshake.address+") 차단", 1, {status:'off'})
		);
		return false;
	}

	socket.on('system', function(recv) {
		switch (recv.type) {
			case 'ping':
				tools.notice("on system("+socket.handshake.address+") => " + recv.type);
				nsp.emit('system', logger.make("PONG", 3));
				break;
			// case 'ready':
			// 	if (!recv.target) return false;

			// 	repeaterManager.ready();
			// 	// repeaterManager.ready(recv.target);
			// 	break;
			// case 'dataset':
			// 	var dataSet = repeaterManager.get(recv.target).getDataset();
			// 	tools.log(dataSet);
			// 	break;
			default:
				break;
		}
	});

	socket.on('disconnect', function() {
		tools.log(socket.handshake.address + " was disconnected.");
		addrManager.deleteClient(socket.handshake.address);

		nsp.emit('system',
			logger.make("클라이언트("+socket.handshake.address+") 종료", 1, {status:'off'})
		);
	});

});

// tools.delay(function() {
// 	repeaterManager.start();
// });

/**
 * CPU Usage
 */
var cpus = [],
	cpus_cnt = 1;

setInterval(function() {
	cpu(50, function(err, results) {
		_.each(results, function (obj){
			cpus.push([cpus_cnt++, obj.cpu]);
		});
	});

	if (cpus.length>=300) {
		nsp.emit('cpu', cpus);
		cpus = [];
		cpus_cnt = 1;
	}
}, 20);