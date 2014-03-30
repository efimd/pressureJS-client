/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 2:53 PM
 * To change this template use File | Settings | File Templates.
 */

var config = {
    protocol : 'http',
    host : 'test.labs.efimd.com',
    port : '9999',
    path : 'echo',
    cacheDns : true,
//    url : 'http://test.labs.efimd.com:9999/echo',
//    url : 'http://127.0.0.1:9999/echo',
    ws_conn : 2000,  // on a t1.micro instance 10K connections run out of memory
    xhr_conn : 0,
    rampup : 10,
    messageSize : 1,
    delay : 10000,
    totalTime : 300,
    statsd : {
        host : 'monitor.labs.efimd.com',
        port : 8125,
        prefix : 'nodeJSapp1',
        suffix : '',
        globalize : false,
        cacheDns : true
    },
    _version : require('../package.json').version
};

module.exports = config;