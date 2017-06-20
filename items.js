var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    ObjectId = require('mongodb').ObjectID;


function ItemDAO(database) {
    "use strict";

    this.db = database;


    this.getItem = function(itemId, callback) {
        "use strict";
        
        this.db.collection("items").findOne({_id: itemId}, function(err, result) {
            assert.equal(null, err);
            callback(result.value);
        });
    }

    this.getItems = function(callback) {
        "use strict";
        
        this.db.collection("items").find({}).toArray(function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.addItem = function(storeId, item, callback) {
        "use strict";

        this.db.collection("stores").findOneAndUpdate(
            {_id: ObjectId(storeId)},
            {"$push": {items: item}},
            {
                upsert: true,
                returnNewDocument: true
            },function(err, result) {
                assert.equal(null, err);
                callback(result.value);
            });
    };

    this.updateItem = function(itemId, item, callback) {
        "use strict";

        this.db.collection("items").findOneAndUpdate({_id: itemId},{"$set": {store: store}},function(err, result) {
            assert.equal(null, err);
            callback(result.value);
        });
    }

    this.removeItem = function(itemId, callback) {
        "use strict";

        this.db.collection("items").remove({_id: itemId}, function(err, result) {
            assert.equal(null, err);
            callback(result.value);
        });
    }

}


module.exports.ItemDAO = ItemDAO;