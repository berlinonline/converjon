var config = require('config').server;
var Moniker = require('moniker');

var name = config.instance_name || Moniker.generator([Moniker.adjective, Moniker.noun]).choose();

module.exports = {
    getName: function(){
        return name;
    }
};
