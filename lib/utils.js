/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 1:01 PM
 * To change this template use File | Settings | File Templates.
 */

var os=require('os');

function getLocalIPv4 () {
    var ip = '';
    var ifaces=os.networkInterfaces();
    for (var dev in ifaces) {
        var alias=0;
        for (var i=0; i < ifaces[dev].length; i++) {
            var details = ifaces[dev][i];
            if (details.family=='IPv4') {
                ip = details.address;
                console.log(dev+(alias?':'+alias:''),ip);
                ++alias;
                if (ip != '127.0.0.1') {
                    return ip;
                }
            }
        }
    }
    return ip;
}

function gethostname() {
    return os.hostname();
}

function getSystemInfo() {
    var attrs = {
        platform: process.platform,
        version: process.version,
        installPrefix: process.installPrefix,
        title: process.title,
        execPath: process.execPath,
        argv: process.argv,
        cwd: process.cwd(),
        gid: process.getgid ? process.getgid() : 0,
        uid: process.getuid ? process.getuid() : 0,
        pid: process.pid,
        umask: process.umask(),
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
        osUptime: os.uptime(),
        totalmem: os.totalmem()
    };
    if (process.uptime) {attrs.uptime = process.uptime();}
    if (process.versions) {attrs.versions = process.versions;}
    if (process.arch) {attrs.arch = process.arch;}

    attrs.env = process.env;
    attrs.cpus = os.cpus();

    return attrs;
}

function getSystemStats() {
    return {
        loadavg: os.loadavg(),
        freemem: os.freemem(),
        memUsage : process.memoryUsage()
    };
}
module.exports.getLocalIPv4 = getLocalIPv4;
module.exports.gethostname = gethostname;
module.exports.getSystemInfo = getSystemInfo;
module.exports.getSystemStats = getSystemStats;