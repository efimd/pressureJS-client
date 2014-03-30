/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 2:51 PM
 * To change this template use File | Settings | File Templates.
 */



process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});



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


