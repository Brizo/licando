var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    ObjectId = require('mongodb').ObjectID;


function StoreDAO(database) {
    "use strict";

    this.db = database;

    this.getStore = function(storeId, callback) {
        "use strict";
        
        this.db.collection("stores").findOne({_id: ObjectId(storeId)}, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.getStores = function(callback) {
        "use strict";
        
        this.db.collection("stores").find({}).toArray(function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.addStore = function(store, callback) {
        "use strict";

        this.db.collection("stores").insert(store, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.storeExist = function(name, location) {
        this.db.collection("stores").find({name:name, location:location}).toArray(function(err, result) {
            assert.equal(null, err);
            if (result.length > 0) {
                return true;
            } else {
                return false;
            }
            
        });
    }


    this.updateStore = function(userId, store, callback) {
        "use strict";

        this.db.collection("stores").findOneAndUpdate(
            {_id: storeId},
            {"$set": {store: store}},

            function(err, result) {
                assert.equal(null, err);
                callback(result.value);
            });
    }

    this.removeStore = function(storeId, callback) {
        "use strict";

        this.db.collection("stores").remove({_id: ObjectId(storeId)}, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }
}


module.exports.StoreDAO = StoreDAO;