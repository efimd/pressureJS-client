/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 4:45 PM
 * To change this template use File | Settings | File Templates.
 */


function printDescription(cfg) {
    [
        ''
        , 'PressureJS:                                     version: '+ cfg._version
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
}

function getUrl(cfg, ip) {
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

module.exports.printDescription = printDescription;
module.exports.getUrl = getUrl;
module.exports.isIpv4 = isIpv4;