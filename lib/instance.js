var config = require('config').server;
var Moniker = require('moniker');
var fs = require('fs');

var name = config.instance_name || Moniker.generator([Moniker.adjective, Moniker.noun]).choose();

var package_json = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));

module.exports = {
    getName: function(){
        return name;
    },
    getVersion: function(){
        return package_json.version;
    }
};
