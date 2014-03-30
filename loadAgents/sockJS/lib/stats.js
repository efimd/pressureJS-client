/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/17/14
 * Time: 11:20 AM
 * To change this template use File | Settings | File Templates.
 */
'use strict';
var ws_metrics = require('measured').createCollection('ws');
var xhr_metrics = require('measured').createCollection('xhr');

function Stats() {
    this.ws = {
        connections : ws_metrics.counter('connections'),                 // WS Connections established
        disconnects : ws_metrics.counter('disconnects'),                 // WS Connections established
        failures : ws_metrics.counter('failures'),                 // WS Connections established
        msgs_sent : ws_metrics.counter('msgs_sent'),                 // WS messages sent
        msgs_received : ws_metrics.counter('msgs_received'),                 // WS messages sent
        latency : ws_metrics.histogram('latency'),
        handshaking : ws_metrics.histogram('handshaking'),
        read : 0,
        send : 0
    };

    this.xhr = {
        connections : xhr_metrics.counter('connections'),                 // xhr Connections established
        disconnects : xhr_metrics.counter('disconnects'),                 // xhr Connections established
        failures : xhr_metrics.counter('failures'),                 // xhr Connections established
        msgs_sent : xhr_metrics.counter('msgs_sent'),                 // xhr messages sent
        msgs_received : xhr_metrics.counter('msgs_received'),                 // xhr messages sent
        latency : xhr_metrics.histogram('latency'),
        handshaking : xhr_metrics.histogram('handshaking'),
        read : 0,
        send : 0
    };

    this.timing = {};    // Different timings
}

/**
 * The metrics has started collecting.
 *
 * @api public
 */
Stats.prototype.start = function start() {
    this.timing.start = Date.now();
};

/**
 * The metrics has started collecting.
 *
 * @api public
 */
Stats.prototype.stop = function start() {
    this.timing.stop = Date.now();
    this.timing.duration = this.timing.stop - this.timing.start;
};

Stats.prototype.getSummary = function () {
    return {
        ws : {
            connections : this.ws.connections.toJSON(),                 // WS Connections established
            disconnects : this.ws.disconnects.toJSON(),                 // WS Connections established
            failures : this.ws.failures.toJSON(),                 // WS Connections established
            msgs_sent : this.ws.msgs_sent.toJSON(),                 // WS messages sent
            msgs_received : this.ws.msgs_received.toJSON(),                 // WS messages sent
            latency : this.ws.latency.toJSON(),
            read : this.ws.read,
            send : this.ws.send
        },
        xhr : {
            connections : this.xhr.connections.toJSON(),                 // WS Connections established
            disconnects : this.xhr.disconnects.toJSON(),                 // WS Connections established
            failures : this.xhr.failures.toJSON(),                 // WS Connections established
            msgs_sent : this.xhr.msgs_sent.toJSON(),                 // WS messages sent
            msgs_received : this.xhr.msgs_received.toJSON(),                 // WS messages sent
            latency : this.xhr.latency.toJSON(),
            read : this.xhr.read,
            send : this.xhr.send
        },
        timing : this.timing
    };

};

Stats.prototype.printSummary = function () {
    console.dir(this.getSummary());
};

module.exports = Stats;
