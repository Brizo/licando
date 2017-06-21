var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    ObjectId = require('mongodb').ObjectID;


function AdminDAO(database) {
    "use strict";

    this.db = database;

    this.getLocation = function(locationId, callback) {
        "use strict";
        
        this.db.collection("locations").findOne({_id: ObjectId(locationId)}, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.getLocations = function(callback) {
        "use strict";
        
        this.db.collection("locations").find({}).toArray(function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.getAllLocations = function() {
        "use strict";
        
        this.db.collection("locations").find({}).toArray(function(err, result) {
            assert.equal(null, err);
            console.log(result);
            return result;
        });
    }

    this.addLocation = function(location, callback) {
        "use strict";

        this.db.collection("locations").insert(location, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }

    this.removeLocation = function(locationId, callback) {
        "use strict";

        this.db.collection("locations").remove({_id: ObjectId(locationId)}, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    }
}


module.exports.AdminDAO = AdminDAO;