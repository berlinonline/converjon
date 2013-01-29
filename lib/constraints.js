var config = require('config').constraints;

var OutOfBoundsException = function(message) {
    this.message = message;
};

var getUrlConstraints = function(url) {
    var i;
    for (i in config.url) {
        if (config.url.hasOwnProperty(i)) {
            if (url.match(i)) {
                return config.url[i];
            }
        }
    }
};

var getConstraint = function (propertyName, constraints) {
    if ( constraints && propertyName in constraints) {
        return constraints[propertyName];
    }
};

var checkContraints = function (query) {
    var urlConstraints = getUrlConstraints(query.url);
    var i, value, constraint;
    for (i in query) {
        if (query.hasOwnProperty(i)) {
            constraint = getConstraint(i, urlConstraints) || getConstraint(i, config.global);

            if (constraint) {
                value = query[i];
                if ("min" in constraint && value < constraint.min) {
                    throw new OutOfBoundsException('"'+ i + '" is smaller that allowed (' + constraint.min + ')');
                }       
                        
                if ("max" in constraint && value > constraint.max) {
                    throw new OutOfBoundsException('"'+ i + '" is larger that allowed (' + constraint.max + ')');
                }
            }
        }
    }
}

module.exports = function(query) {
    checkContraints(query, config.global);
};
