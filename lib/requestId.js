var nextRequestId = -1;

module.exports = function() {
    nextRequestId++;
    return nextRequestId;
};
