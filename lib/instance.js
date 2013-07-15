var Moniker = require('moniker');

var name = Moniker.generator([Moniker.adjective, Moniker.noun]).choose();

module.exports = {
    getName: function(){
        return name;
    }
};
