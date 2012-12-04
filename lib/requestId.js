var nextRequestId = -1;

module.exports = function() {
    return nextRequestId++;
};
