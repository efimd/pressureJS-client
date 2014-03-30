/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 12:52 PM
 * To change this template use File | Settings | File Templates.
 */


var WebSocket = require('ws');

var utils = require('./lib/utils');
var testRunner = require('./lib/testRunner');

var ws = new WebSocket('ws://localhost:8888/agent');

var config = {};
var statInterval;

ws.on('open', function() {

    var msg = {
        type : 'init',
        ip : utils.getLocalIPv4(),
        hostname : utils.gethostname(),
        version : require('./package.json').version,
        info : utils.getSystemInfo()
    };

    ws.send(JSON.stringify(msg));
});

ws.on('message', function(data, flags) {
//    console.log(data);
    var msg = {};
    try {
        msg = JSON.parse(data);
    }
    catch (e) {
        console.error('Error parsing message: '+ data + ' e:'+e);
    }

    if (msg.type == 'initConfig') {
        console.log('Initialized with server: v='+ msg.meta.ver);
        config = msg.config;
        init(config);

        ws.send(JSON.stringify({
            type : 'ready'
        }));
    }
    else if (msg.type == 'initTest') {
        var test = {
            name : msg.name,
            config : msg.config,
            testConfig : msg.testConfig
        };

        testRunner.initTest(test, function (err) {
            var resMsg = {};

            if (err) {
                resMsg = {
                    type : 'initTestFailed',
                    err : err
                };
            }
            else {
                resMsg = {
                    type : 'testReady'
                };
            }

            ws.send(JSON.stringify(resMsg));
        });
    }
    else if (msg.type == 'getTestConfig') {

    }
    else if (msg.type == 'startTest') {
        var test = {
            name : msg.name,
            config : msg.config,
            testConfig : msg.testConfig
        };

        testRunner.startTest(test, function (err) {
            var resMsg = {};

            if (err) {
                resMsg = {
                    type : 'startTestFailed',
                    err : err
                };
            }
            else {
                resMsg = {
                    type : 'testStarted'
                };
            }

            ws.send(JSON.stringify(resMsg));
        });
    }

});

ws.on('close', function () {
    clearInterval(statInterval);
});

function init(cfg) {
    if (cfg.stat_period) {
        console.log('Will report stats every:'+ cfg.stat_period + ' ms');
        statInterval = setInterval(reportStats, cfg.stat_period);
    }
}

function reportStats() {
    ws.send(JSON.stringify({
        type : 'sysStats',
        stats : utils.getSystemStats()
    }));
}
