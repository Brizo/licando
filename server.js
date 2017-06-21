var express = require('express'),
    bodyParser = require('body-parser'),
    nunjucks = require('nunjucks'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    multer  = require('multer'),
    ItemDAO = require('./items').ItemDAO,
    StoreDAO = require('./store').StoreDAO;
    AdminDAO = require('./admin').AdminDAO;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, "./static/uploads");
  },
    filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

var uploadStore = multer({ storage : storage}).array('icon', 2);
var uploadItem = multer({ storage : storage}).single('pic');
    
app = express();

app.use(function(req, res, next) {  
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
 });  

app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));

/*
 Configure nunjucks to work with express
 Not using consolidate because I'm waiting on better support for template inheritance with
 nunjucks via consolidate. See: https://github.com/tj/consolidate.js/pull/224
*/
var env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('MMMM Do YYYY, h:mm:ss a');
env.addFilter("date", nunjucksDate);

var ITEMS_PER_PAGE = 5;

MongoClient.connect('mongodb://bristo:Sihlongo7@ds133162.mlab.com:33162/licando', function(err, db) {
    "use strict";

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    var items = new ItemDAO(db);
    var store = new StoreDAO(db);
    var admin = new AdminDAO(db);
    
    var router = express.Router();

    // display home page
    router.get("/", function(req, res) {
        "use strict";

        admin.getLocations(function(locations) {
            store.getStores(function(stores) {
                res.render('home', {allStores: stores, allLocations:locations, isActive:'stores',navTabActive: 'list'});
            });
        });
    });

    // display admin page
    router.get("/admin", function(req, res) {
        "use strict";

        admin.getLocations(function(locations) {
            res.render('admin', {allLocations: locations, isActive:'admin',navTabActive: 'list'});
        });
    });

    // display admin page
    router.post("/admin", function(req, res) {
        "use strict";

        var location = {location:req.body.location};

        admin.addLocation(location, function(resp) {
            admin.getLocations(function(locations) {
                res.render('admin', {allLocations: locations, isActive:'admin',navTabActive: 'add',status: 'success', msg:'Success : Location Successfully Added'});
            });
        });
    });

    // display store details
    router.get("/store/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.json(store);
        });
    });

    // list all stores
    router.get("/items/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.render('items', {store:store, navTabActive: 'list', isActive:'stores'});
        });
    });

    // display page to add new item
    router.get("/item/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.render('items', {store:store, navTabActive: 'add', isActive:'stores'});
        });
    });

    // display store to be updated
    router.get("/updateStore/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.render('updateStore', {store:store, isActive:'stores'});
        });
    });

    // display store to be removed
    router.get("/removeStore/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.render('removeStore', {store:store, isActive:'stores'});
        });
    });

    // delete store
    router.post("/removeStore/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.removeStore(storeId, function(resp) {
           store.getStores(function(stores) {
                res.render('home', {allStores: stores, isActive:'stores',navTabActive: 'list', status: 'success', msg:'Success : Store successfully removed'});
            });
        });
    });

    // delete location
    router.post("/removeLocation/:locationId", function(req, res) {
        "use strict";

        var locationId = req.params.locationId;

        admin.removeLocation(locationId, function(resp) {
           admin.getLocations(function(locations) {
                res.render('admin', {allLocations: locations, isActive:'admin',navTabActive: 'list', status: 'success', msg:'Success : Location successfully removed'});
            });
        });
    });

    // capture new item form data
    router.post("/item/:storeId", function(req, res) {
        "use strict";

        uploadItem(req,res,function(err) {

            if(err) {
                return res.end("Error uploading file.");
            }

            var pic = '/static/uploads/'+req.file.filename;

            var storeId = req.params.storeId;
            var formItem = {};

            formItem['name'] = req.body.itemName;
            formItem['category'] = req.body.itemCategory;
            formItem['description'] = req.body.itemDescr;
            formItem['price'] = req.body.itemPrice;
            formItem['icon'] = pic;

            items.addItem(storeId,formItem, function(oldStore) {
                store.getStore(storeId, function(newStore) {
                    res.render('items', {store:newStore, isActive:'stores', status: 'success', msg:'Item Successfully added', navTabActive: 'add'});
                });
            });
        });
    });

    router.post("/store", function(req, res) {
        "use strict";

        uploadStore(req,res,function(err) {
            var icon = null;
            if (req.files[0]) {
                icon = '/static/uploads/'+req.files[0].filename;
            }

            var banner = null;
            if (req.files[1]) {
                banner = '/static/uploads/'+req.files[1].filename;
            }

            var formStore = {};
            formStore['name'] = req.body.name;
            formStore['icon'] = icon;
            formStore['banner'] = banner;
            formStore['location'] = req.body.location;
            formStore['contacts'] = req.body.contacts;
            formStore['address'] = req.body.address;
            formStore['deliver'] = req.body.deliver;
            formStore['deliveryFee'] = req.body.deliveryFee;
            formStore['workHours'] = req.body.workHours;
            formStore['minOrder'] = req.body.minOrder;
            formStore['items'] = [];
    
            if (formStore['name'] == null || formStore['icon'] == null || formStore['banner'] == null || formStore['location'] == null 
                ||  formStore['contacts'] == null || formStore['address'] == null || formStore['deliver'] == null || formStore['deliveryFee'] == null 
                || formStore['workHours'] == null || formStore['minOrder'] == null) {
                res.render('home', {isActive:'stores', status: 'danger', msg:'Error : Please fill all fields', navTabActive: 'add', form: formStore});
            } else {
                
                if(err) {
                    return res.end("Error uploading file.");
                }

                var catergoriesArray = new Array();
                var itemCategories = req.body.itemCategories;
                var catergoriesArray = itemCategories.split(',');
                formStore['catergories'] = catergoriesArray;

                if (store.storeExist(formStore.name, formStore.location)) {
                    res.render('home', {isActive:'stores', status: 'danger', msg:'Error : Store Already Exist', navTabActive: 'add', form: formStore});
                } else {
                    store.addStore(formStore, function(storeDoc) {
                        admin.getLocations(function(locations) {
                            store.getStores(function(stores) {
                               res.render('home', {allStores: stores, isActive:'stores',allLocations:locations, status: 'success', msg:'Success : Store Successfully added', navTabActive: 'add'});
                            })
                        })
                    });
                }
                
            }
        });        
    });

    // update store
    router.put("/store/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;
        var storeInfo = req.body;

        store.updateStore(storeId, storeInfo, function(storeDoc) {
            console.log(itemDoc);
        });
    });

    // update item
    router.put("/item/:storeId", function(req, res) {
        "use strict";

        var itemId = req.params.itemId;
        var itemInfo = req.body;

        items.updateItem(itemId, itemInfo, function(itemDoc) {
            console.log(itemDoc);
        });
    });

    // remove item
    router.delete("/item/:storeId", function(req, res) {
        "use strict";

        var itemId = req.params.itemId;

        items.removeItem(itemId, function(resp) {
            console.log(resp);
        });
    });

    //==============================================API=================================
    router.get("/api/stores", function(req, res) {
        "use strict";

        store.getStores(function(stores) {
            res.json(stores);
        });
    });

    router.get("/api/locations", function(req, res) {
        "use strict";

        admin.getLocations(function(locations) {
            res.json(locations);
        });
    });

    router.get("/api/store/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.json(store);
        });
    });
    
    // Use the router routes in our application
    app.use('/', router);

    // Start the server listening
    var server = app.listen(process.env.PORT || 5000, function() {
        var port = server.address().port;
        console.log('Licando server listening on port %s.', port);
    });

});
