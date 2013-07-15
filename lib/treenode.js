var uuid = require('uuid');

var Node = function(key, body, color, left, right, parent) {
    var node = {
        key: key,
        body: body,
        left: left,
        right: right,
        color: color,
        parent: parent,
        id: uuid.v4()
    };
    return node;
};

module.exports = Node;

