/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 12:52 PM
 * To change this template use File | Settings | File Templates.
 */


var WebSocket = require('ws');

var utils = require('./lib/utils');

var ws = new WebSocket('ws://localhost:8081/ui');

var config = {};
var statInterval;

ws.on('open', function() {

    var msg = {
        type : 'init',
        ip : utils.getLocalIPv4(),
        hostname : utils.gethostname(),
        info : utils.getSystemInfo()
    };

    ws.send(JSON.stringify(msg));
});
ws.on('message', function(data, flags) {
    console.log(data);
    var msg = {};
    try {
        msg = JSON.parse(data);
    }
    catch (e) {
        console.error('Error parsing message: '+ data + ' e:'+e);
    }

    if (msg.type == 'initConfig') {
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

        runTest(test);

    }

});

ws.on('close', function () {
    clearInterval(statInterval);
});

function init(cfg) {
    if (cfg.stat_period) {
        statInterval = setInterval(reportStats, cfg.stat_period);
    }
}


function runTest(test) {


}

function reportStats() {
    ws.send(JSON.stringify({
        type : 'sysStats',
        stats : utils.getSystemStats()
    }));
}
