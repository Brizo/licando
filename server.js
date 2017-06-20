var express = require('express'),
    bodyParser = require('body-parser'),
    nunjucks = require('nunjucks'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    multer  = require('multer'),
    ItemDAO = require('./items').ItemDAO,
    StoreDAO = require('./store').StoreDAO;

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

MongoClient.connect('mongodb://localhost:27017/licando', function(err, db) {
    "use strict";

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    var items = new ItemDAO(db);
    var store = new StoreDAO(db);
    
    var router = express.Router();

    // display home page
    router.get("/", function(req, res) {
        "use strict";

        store.getStores(function(stores) {
            res.render('home', {allStores: stores, isActive:'stores',navTabActive: 'list'});
        });
    });

    // display admin page
    router.get("/admin", function(req, res) {
        "use strict";

        store.getStores(function(stores) {
            res.render('admin', {isActive:'admin'});
            
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
            res.render('items', {store:store, navTabActive: 'list'});
        });
    });

    // display page to add new item
    router.get("/item/:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.getStore(storeId, function(store) {
            res.render('items', {store:store, navTabActive: 'add'});
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
                    res.render('items', {store:newStore, isActive:'items', status: 'success', msg:'Item Successfully added', navTabActive: 'add'});
                });
            });
        });
    });

    router.post("/store", function(req, res) {
        "use strict";

        uploadStore(req,res,function(err) {
            var icon = '/static/uploads/'+req.files[0].filename;
            var banner = '/static/uploads/'+req.files[1].filename;

            if(err) {
                return res.end("Error uploading file.");
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

            var catergoriesArray = new Array();
            var itemCategories = req.body.itemCategories;
            var catergoriesArray = itemCategories.split(',');
            formStore['catergories'] = catergoriesArray;

            store.addStore(formStore, function(storeDoc) {
                store.getStores(function(stores) {
                   var stores = stores;
                   console.log(stores);
                   res.render('home', {allStores: stores, isActive:'stores', status: 'success', msg:'Store Successfully added', navTabActive: 'add'});
                })
            });
        });        
    });

    // update store
    router.put("/store:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;
        var storeInfo = req.body;

        store.updateStore(storeId, storeInfo, function(storeDoc) {
            console.log(itemDoc);
        });
    });

    // update item
    router.put("/item:storeId", function(req, res) {
        "use strict";

        var itemId = req.params.itemId;
        var itemInfo = req.body;

        items.updateItem(itemId, itemInfo, function(itemDoc) {
            console.log(itemDoc);
        });
    });

    // delete store
    router.delete("/store:storeId", function(req, res) {
        "use strict";

        var storeId = req.params.storeId;

        store.removeStore(storeId, function(resp) {
            console.log(resp);
        });
    });

    // remove item
    router.delete("/item:storeId", function(req, res) {
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
    var server = app.listen(3000, function() {
        var port = server.address().port;
        console.log('Licando server listening on port %s.', port);
    });

});
