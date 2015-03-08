// Get a named logger so we can post messages in the log
var log = require('oae-logger').logger('oae-globalemsg-rest');

// Import the core OAE utility that contains the Express servers on which we can bind routes
var OAE = require('oae-util/lib/oae');

// Import the API component to get the task create and listing functionality
var GlobaleMsgAPI = require("./api");

/**
 * Handle a "get" request to the path /api/tasklist/test that will log an entry indicating we have
 * successfully bound a web route.
 */
OAE.tenantRouter.on('get', '/api/globalemsg', function(req, res) {

    // The `ctx` ("context") object attached to the request is added in a request processor (i.e.,
    // "middleware") that tells us which tenant on which the request was made, the user who is
    // authenticated to the request (if any). This context is used when invoking request to the APIs
    // in all the modules in the system
    var ctx = req.ctx;
    log().info("message Apple GET Hilary");

    // Call the API to get the list of tasks for the current user in context
    GlobaleMsgAPI.listGms(ctx, function(err, gmss) {
        if (err) {
            // If there was any error fetching tasks, respond with the error code and message
            res.send(err.code, err.msg);
            return;
        }

        // We successfully got the list of tasks, send it to the client
        // 
        log().info("message Apple GET OK"+gmss);
        res.send(gmss);
    });
});

/**
 * Handle a "post" request that adds a task to the current user's gms list
 */
OAE.tenantRouter.on('post', '/api/globalemsg', function(req, res) {
    // The `ctx` ("context") object attached to the request is added in a request processor (i.e.,
    // "middleware") that tells us which tenant on which the request was made, the user who is
    // authenticated to the request (if any). This context is used when invoking request to the APIs
    // in all the modules in the system
    var ctx = req.ctx;
    log().info("message Apple POST Hilary");
    log().info("Requette :"+req.body.description);
    log().info("Requette Date :"+req.body.date_start);
    log().info("Requette Conv Date :"+Date.parse(req.body.date_start));
    // Express makes request data for POST requests available on the "body" object of the request
    var title = req.body.title;
    var description = req.body.description;

    var date_start = Date.parse(req.body.date_start);
    var date_end = Date.parse(req.body.date_end);
    var send_mail = Number(req.body.send_mail);
    var level = Number(req.body.level);

    // Call the API to add a globale message to the gms list of the user in context
    GlobaleMsgAPI.addGms(ctx, title, description, date_start, date_end, send_mail, level, function(err, gms) {
        if (err) {
            // If there was any error adding the task, respond with the error code and message
            res.send(err.code, err.msg);
            return;
        }

        // We successfully created the task, send its model to the client
        res.send(gms);
    });
});

/**
 * Handle a "delete" request that deletes a task from the current user's task list
 */
OAE.tenantRouter.on('delete', '/api/globalemsg/:created', function(req, res) {
    // The `ctx` ("context") object attached to the request is added in a request processor (i.e.,
    // "middleware") that tells us which tenant on which the request was made, the user who is
    // authenticated to the request (if any). This context is used when invoking request to the APIs
    // in all the modules in the system
    var ctx = req.ctx;

    // Since the "created" property is coming from path parameter ":created", we access it from the
    // "params" object of the Express Request
    var created = parseInt(req.params.created, 10);
    log().info("message REST DELETE Hilary");
    // Call the API to delete the task from the task list of the user in context
    GlobaleMsgAPI.deleteGms(ctx, created, function(err) {
        if (err) {
            // If there was any error deleting the task, respond with the error code and message
            res.send(err.code, err.msg);
            return;
        }

        // We successfully deleted the task, reply with a 200 HTTP status code and no body
        res.send();
    });
});


