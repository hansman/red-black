var Node = require('./node');

var Tree = function(name, redisClient) {
    this.name = name;
    this.redisClient = redisClient;
    this.nil = Node(null, null, 'black', null, null, null);
    var tree = this;
    this.redisClient.get(this.name+'.root', function(err, data){
        if(err) {
            cb && cb(null);
        } else {
            tree.root = data;
        }
    });
};

Tree.prototype.findSpot = function(x, y, z, cb) {
    if (x.id === this.nil.id) {
        cb && cb(y);
        return;
    }
    var tree = this;
    y = x;
    if (z.key < x.key) {
        this.getRedis(x.left, function(data) {
            tree.findSpot(data, y, z, cb);
        });
    } else {
        this.getRedis(x.right, function(data) {
            tree.findSpot(data, y, z, cb);
        });
    }
};

Tree.prototype.insert = function(key, body) {
    var y = this.nil,
        z = Node(key, body, 'red', this.nil.id, this.nil.id, null);
    this.getRedis('root', function(err, data) {
        var x = data;
        tree.findSpot(x, y, z, function(y) {
            z.parent = y.id;
            if (y.id === tree.nil.id) {
                tree.setRedis(z, true, function() {
                    tree.insertFixup(z);
                });
            } else if (z.key < y.key) {
                y.left = z.id;
                tree.setRedis(y, false, function() {
                    tree.setRedis(z, false, function() {
                        tree.insertFixup(z);
                    });
                });
            } else {
                y.right = z.id;
                tree.setRedis(y, false, function() {
                    tree.setRedis(z, false, function() {
                        tree.insertFixup(z);
                    });
                });
            }
        });
    });
};

Tree.prototype.insertFixup = function(z) {
    var tree = this;
    this.getRedis(z.parent, function(parent) {
        if (parent.color === 'red') {
            tree.getRedis(parent.parent, function(parentParent) {
                if (parent.id === parentParent.left) {
                    tree.getRedis(parentParent.right, function(y) {
                        if (y.color === 'red') {
                            parent.color = y.color = 'black';
                            parentParent.color = 'red';
                            z = parentParent;
                            tree.setRedis(parent, false, function() {
                                tree.setRedis(parentParent, false, function() {
                                    tree.setRedis(z, false, function() {
                                        tree.insertFixup(z);
                                    });
                                });
                            });
                        } else if (z.id === parent.right) {
                            z = parent;
                            tree.setRedis(z, false, function() {
                                tree.leftRotate(z, function() {
                                    tree.insertFixup(z);
                                });
                            });
                        } else {
                            parent.color = 'black';
                            parentParent.color = 'red';
                            tree.setRedis(parent, false, function() {
                                tree.setRedis(parentParent, false, function() {
                                    tree.rightRotate(parentParent, function() {
                                        tree.insertFixup(z);
                                    });
                                });
                            });
                        }
                    });
                } else {
                    tree.getRedis(parentParent.left, function(y) {
                        if (y.color === 'red') {
                            parent.color = y.color = 'black';
                            parentParent.color = 'red';
                            z = parentParent;
                            tree.setRedis(parent, false, function() {
                                tree.setRedis(parentParent, false, function() {
                                    tree.setRedis(z, false, function() {
                                        tree.insertFixup(z);
                                    });
                                });
                            });
                        } else if (z.id === parent.left) {
                            z = parent;
                            tree.setRedis(z, false, function() {
                                tree.rightRotate(z, function() {
                                    tree.insertFixup(z);
                                });
                            });
                        } else {
                            parent.color = 'black';
                            parentParent.color = 'red';
                            tree.setRedis(parent, false, function() {
                                tree.setRedis(parentParent, false, function() {
                                    tree.leftRotate(parentParent, function() {
                                        tree.insertFixup(z);
                                    });
                                });
                            });
                        }
                    });
                }
            });
        } else {
            tree.getRedis('root', function(root) {
                root.color = 'black';
                tree.setRedis(root, true);
            });
        }
    });
};

Tree.prototype.leftRotate = function(x, cb) {
    var tree = this;
    this.getRedis(x.right, function(y) {
        this.getRedis(y.left, function(yLeft) {
            this.getRedis(x.parent, function(xParent) {
                x.right = y.left;
                if (y.left != tree.nil.id) {
                    yLeft.parent = x.id;
                }
                y.parent = x.parent;
                var yIsRoot = false;
                if (x.parent == tree.nil.id) {
                    yIsRoot = true;
                } else if (x.id == xParent.left) {
                    xParent.left = y.id;
                } else {
                    xParent.right = y.id;
                }
                y.left = x.id;
                x.parent = y.id;
                tree.setRedis(x, false, function() {
                    tree.setRedis(yLeft, false, function() {
                        tree.setRedis(y, yIsRoot, function() {
                            tree.setRedis(xParent, false, cb);
                        });
                    });
                });
            });
        });
    });
};

Tree.prototype.rightRotate = function(y, cb) {
    var tree = this;
    this.getRedis(y.left, function(x) {
        this.getRedis(x.right, function(xRight) {
            this.getRedis(y.parent, function(yParent) {
                y.left = x.right;
                if (x.right != tree.nil.id) {
                    xRight.parent = y.id;
                }
                x.parent = y.parent;
                var xIsRoot = false;
                if (y.parent == tree.nil.id) {
                    xIsRoot = true;
                } else if (y.id == yParent.right) {
                    yParent.right = x.id;
                } else {
                    yParent.left = x.id;
                }
                x.right = y.id;
                y.parent = x.id;
                tree.setRedis(y, false, function() {
                    tree.setRedis(xRight, false, function() {
                        tree.setRedis(x, xIsRoot, function() {
                            tree.setRedis(yParent, false, cb);
                        });
                    });
                });
            });
        });
    });
};

Tree.prototype.transplant = function() {

};

Tree.prototype.remove = function() {

};

Tree.prototype.removeFixup = function() {

};

Tree.prototype.get = function(key) {

};

Tree.prototype.setRedis = function(node, root, cb) {
    var tree = this;
    try {
        this.redisClient.set(this.name+'.'+node.id, JSON.stringify(node), function() {
            if (root) {
                tree.redisClient.set(this.name+'.root', JSON.stringify(node), cb);
            } else {
                cb && cb();
            }
        });
    } catch(e) {
        cb && cb('problem setting value');
    }
};

Tree.prototype.getRedis = function(id, cb) {
    var tree = this;
    this.redisClient.get(this.name+'.'+id, function(err, data) {
        if (err) {
            data = tree.nil;
        } else{
            try {
                data = JSON.parse(data);
            } catch(e) {
                data = tree.nil;
            }
        }
        cb && cb(data);
    });
};

module.exports = Tree;