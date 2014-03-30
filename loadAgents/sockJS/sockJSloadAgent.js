/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 2:51 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');
var http = require('http');
var StatsD = require('node-statsd').StatsD;
var dns = require('dns');

http.globalAgent.maxSockets = 100000;

var Stats = require('.lib/stats.js');
var sjsc_xhr = require('.lib/clients/sockjs-client-xhr');
var sjsc_ws = require('.lib/clients/sockjs-client-ws');

var numCPUs = require('os').cpus().length;

var config = require('.conf/config.js');
var cfg = config;


console.log('Initializing...');

var statsdClient = null;

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
        console.error("Error in socket: ", error);
        return;
    });
}

var stats = new Stats();


if (cfg.cacheDns && !isIpv4(cfg.host)) {
    dns.resolve4(cfg.host, function (err, addresses) {
        if (err) {
            throw err;
        }
        cfg.url = getUrl(addresses[0]);
        start();
    });

}
else {
    cfg.url = getUrl();
    start();
}

function getUrl(ip) {
    var url = cfg.protocol + '://';

    url+= ip || cfg.host;

    if (cfg.port) {
        url += ':'+ cfg.port;
    }

    if (cfg.path) {
        url += '/' + cfg.path;
    }

    return url;
}

function start() {

    [
        ''
        , 'PressureJS:       #cpus:'+numCPUs+'                     version: '+ cfg._version
        , ''
        , 'Pressure summary:'
        , '- ' + cfg.url + ' url'
        , '- ' + cfg.ws_conn + ' concurrent/parallel WS SockJS connections.'
        , '- '+ cfg.xhr_conn + ' concurrent/parallel XHR Streaming SockJS connections.'
        , '- '+ cfg.rampup + ' seconds to ramp up.'
        , '- '+ cfg.delay + ' ms to delay between messages.'
        , '- '+ cfg.messageSize + ' chars message size.'
        , '- '+ cfg.totalTime + ' seconds total run time.'
    ].forEach(function stdout(line) {
            console.log(line);
        });



    var jobs = [];
    var total_jobs = cfg.ws_conn + cfg.xhr_conn;
    var ws_cnt = cfg.ws_conn;
    var xhr_cnt = cfg.xhr_conn;

    var delay = Math.ceil((cfg.rampup*1000) / (total_jobs-1));

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

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});

function isIpv4(ip) {
    var d = ip.split('.'), i = d.length;
    if (i!=4) {
        return false;
    }
    var ok = true;
    while (i-- && ok) {
        ok = false;
        if (d[i].length!=0) {
            if (parseInt(d[i])) {
                if (d[i]>-1 && d[i]<256) {
                    ok = true;
                }
            }
        }
    }
    return ok;
}

function showProgress() {
    setInterval(function () {
        statsdClient.timing('ws_latency', stats.ws.latency.toJSON().mean);
        statsdClient.timing('xhr_latency', stats.xhr.latency.toJSON().mean);
//        console.log(stats.ws.latency.toJSON().mean);
        var d = new Date();
        var h = d.getHours();
        var m = d.getMinutes();
        var s = d.getSeconds();

        var d_str = h + ':' + m + ':' +s;
        console.log(d_str + ' #conn: ws: ' + (stats.ws.connections.toJSON() - stats.ws.disconnects.toJSON()) + ' msgs: ' + stats.ws.msgs_sent.toJSON() + '/' + stats.ws.msgs_received.toJSON() + ' xhr: ' + (stats.xhr.connections.toJSON() - stats.xhr.disconnects.toJSON())+ ' msgs: ' + stats.xhr.msgs_sent.toJSON() + '/' + stats.xhr.msgs_received.toJSON() );
    }, 1000);
}


