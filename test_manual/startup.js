var config = require("../lib/config");
config.load();

require("../lib/server/startup")(function(){
});
