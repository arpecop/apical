var nano = require('nano')('http://1:1@127.0.0.1:5984'),
    cdb = nano.use('db'),
    ddb = nano.use('socket')
//d
function cron() {
    nano.db.create('socket');
    nano.db.create('db');
    nano.db.create('users');
    nano.db.create('log');
    ddb.insert({
        "_id": "_design/t",
        "language": "javascript",
        "views": {
            "t": {
                "map": "function(doc) {\nif(doc.type) {\n  emit(doc.type, doc);\n}\n}",
                "reduce": "function(keys, values, rereduce) {\n  if (rereduce) {\n    return sum(values);\n  } else {\n    return values.length;\n  }\n}"
            },
            "i": {
                "map": "function(doc) {\nif(doc.type) {\n  emit(doc._id, doc);\n}\n}",
                "reduce": "function(keys, values, rereduce) {\n  if (rereduce) {\n    return sum(values);\n  } else {\n    return values.length;\n  }\n}"
            }
        }
    }, function () { })
    cdb.insert({
        "_id": "_design/t",
        "language": "javascript",
        "views": {
            "t": {
                "map": "function(doc) {\nif(doc.type) {\n  emit(doc.type, doc);\n}\n}",
                "reduce": "function(keys, values, rereduce) {\n  if (rereduce) {\n    return sum(values);\n  } else {\n    return values.length;\n  }\n}"
            },
            "i": {
                "map": "function(doc) {\nif(doc.type) {\n  emit(doc._id, doc);\n}\n}",
                "reduce": "function(keys, values, rereduce) {\n  if (rereduce) {\n    return sum(values);\n  } else {\n    return values.length;\n }\n}"
            }
        }
    }, function (err, doc) {
        console.log(doc);
    })
}
cron();
module.exports = {
    cron: cron
}
