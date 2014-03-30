/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 3/30/14
 * Time: 4:11 PM
 * To change this template use File | Settings | File Templates.
 */

var testCode;

function initTest(test, cb) {
    var t_name = '../loadAgents/'+test.name+'/loadTest';
    var testCode = require(t_name);

    testCode['init'](test,cb);
}

function startTest(test, cb) {
    var t_name = '../loadAgents/'+test.name+'/loadTest';
    var testCode = require(t_name);

    testCode['start'](test,cb);
}


module.exports.initTest = initTest;
module.exports.startTest = startTest;