var async = require('async');
var http = require('http');
var StatsD = require('node-statsd').StatsD;
var dns = require('dns');

http.globalAgent.maxSockets = 100000;

var Stats = require('./lib/stats.js');
var sjsc_xhr = require('./lib/clients/sockjs-client-xhr');
var sjsc_ws = require('./lib/clients/sockjs-client-ws');

var numCPUs = require('os').cpus().length;

var utils = require('./lib/utils');

var defaultConfig = require('./conf/default.js');
var cfg = defaultConfig;


console.log('Initializing...');

var statsdClient = null;
var stats = null;

function init (test, cb) {
    if (cfg.statsd) {
        statsdClient = new StatsD({
            host : cfg.statsd.host,
            port : cfg.statsd.port,
            prefix : cfg.statsd.prefix,
            suffix : cfg.statsd.suffix,
            globalize : cfg.statsd.globalize,
            cacheDns : cfg.statsd.cacheDns
        });

        statsdClient.socket.on('error', function(error) {
            console.error("Error in STATSD socket: ", error);
            cb("Error in STATSD socket: ", error);
            return;
        });
    }

    stats = new Stats();

    if (cfg.cacheDns && !utils.isIpv4(cfg.host)) {
        dns.resolve4(cfg.host, function (err, addresses) {
            if (err) {
                throw err;
            }
            cfg.url = utils.getUrl(cfg, addresses[0]);
            cb();
        });

    }
    else {
        cfg.url = utils.getUrl(cfg);
        cb();
    }
}



function start(test, cb) {

    var jobs = [];
    var total_jobs = cfg.ws_conn + cfg.xhr_conn;
    var ws_cnt = cfg.ws_conn;
    var xhr_cnt = cfg.xhr_conn;

    var delay = Math.ceil((cfg.rampup*1000) / (total_jobs-1));

    utils.printDescription(cfg);

    for (var i=0; i<total_jobs; i++) {
        var type = '';

        if ((i%2)==0) {
            if (ws_cnt>0) {
                type = 'ws';
                ws_cnt--;
            }
            else {
                type = 'xhr';
                xhr_cnt--;
            }
        }
        else {
            if (xhr_cnt>0) {
                type = 'xhr';
                xhr_cnt--;
            }
            else {
                type = 'ws';
                ws_cnt--;
            }
        }


        jobs.push(getJob(type, {
            jobid : i,
            url : cfg.url,
            msg_delay : cfg.delay,
            totalTime : cfg.totalTime,
            delay : i*delay,
            msgTxt : getMsgStr(cfg.messageSize, i)
        }));
    }


    function runJobs(jobs) {
        stats.start();
        async.parallel(jobs, function () {
            console.log('All jobs finished');
            stats.stop();
            stats.printSummary();
            process.exit(0);
        });
    }

    showProgress();

    runJobs(jobs);

    function getMsgStr(maxLength, id) {
        var str = ''+id;
        while (str.length < maxLength) {
            str = 'x' + str;
        }
        return str;
    }

    function getJob(type, jobDescr) {

        return function (cb) {
            var fn = function () {
                var msg_cnt = 0;
                var end_cnt = 0;
                var client = null;
                var msg_timer = null;
                var mystats = null;
                if (type == 'ws') {
                    client = sjsc_ws.create(jobDescr.url);
                    mystats = stats.ws;
                }
                else if (type == 'xhr') {
                    client = sjsc_xhr.create(jobDescr.url);
                    mystats = stats.xhr;
                }
                else {
                    console.log('ERROR - wrong job type', type);
                    cb('Wrong type:'+type);
                    return;
                }

                client.on('connection', function () {
                    mystats.connections.inc();

                    client.on('data', function (msg) {
                        var msgObj = JSON.parse(msg);
                        var latency = Date.now() - msgObj.ts;
                        msg_cnt--;
                        mystats.msgs_received.inc();

                        mystats.latency.update(latency);
                    });

                    sendMsg();
                });

                client.on('close', function (e) {
                    mystats.disconnects.inc();

                    cb();
                });

                client.on('error', function (e) {
                    mystats.failures.inc();
                    console.log('ERROR' + e);
                    cb();
                });

                setTimeout(endJob, cfg.totalTime*1000 + cfg.rampup);



                function endJob() {
                    if (msg_cnt>0 && end_cnt<5) {
                        end_cnt++;
                        setTimeout(endJob, 1000);
                        return;
                    }

                    if (msg_timer) {
                        clearTimeout(msg_timer);
                    }
                    client.close();
                }

                function sendMsg() {
                    msg_cnt++;
                    mystats.msgs_sent.inc();
                    client.write(JSON.stringify({
                        ts : Date.now(),
                        jobid : jobDescr.jobid,
                        txt : jobDescr.msgTxt
                    }));

                    msg_timer = setTimeout(sendMsg, cfg.delay);
                }


            };

            if (jobDescr.delay > 0) {
                setTimeout(fn, jobDescr.delay);
            }
            else {
                fn();
            }
        };
    }
}













module.exports.init = init;
module.exports.start = start;