// Get a named logger so we can post messages in the log
var log = require('oae-logger').logger('oae-globalemsg-rest');

// Import the core OAE utility that contains the Express servers on which we can bind routes
var OAE = require('oae-util/lib/oae');

// Import the API component to get the global message create and listing functionality
var GlobaleMsgAPI = require("./api");



OAE.tenantRouter.on('get', '/api/globalemsg/user', function(req, res) {
    GlobaleMsgAPI.showGms(req.ctx, function(err, gmss_user) {
        if (err) {
            // If there was any error fetching gmss, respond with the error code and message
            res.send(err.code, err.msg);
            log().debug("Req GET error :");
            log().debug("code error :"+err.code);
            log().debug("message error :"+err.msg);
            return;
        }

        // We successfully got the list of gmss, send it to the client
        // 
        log().debug("Req GET OK :"+gmss);
        res.send(gmss);
    });
});

/**
 * Handle a "get" request to the path /api/globalemsg that will log an entry indicating we have
 * successfully bound a web route.
 */
OAE.tenantRouter.on('get', '/api/globalemsg', function(req, res) {

    // The `ctx` ("context") object attached to the request is added in a request processor (i.e.,
    // "middleware") that tells us which tenant on which the request was made, the user who is
    // authenticated to the request (if any). This context is used when invoking request to the APIs
    // in all the modules in the system
    var ctx = req.ctx;

    // Call the API to get the list of tasks for the current user in context
    GlobaleMsgAPI.listGms(ctx, function(err, gmss) {
        if (err) {
            // If there was any error fetching tasks, respond with the error code and message
            res.send(err.code, err.msg);
            log().debug("Req GET error :");
            log().debug("code error :"+err.code);
            log().debug("message error :"+err.msg);
            return;
        }

        // We successfully got the list of tasks, send it to the client
        // 
        log().debug("Send object :"+gmss);
        res.send(gmss);
    });
});

/**
 * Handle a "post" request that adds a global message to the current user's gms list
 */
OAE.tenantRouter.on('post', '/api/globalemsg', function(req, res) {
    // The `ctx` ("context") object attached to the request is added in a request processor (i.e.,
    // "middleware") that tells us which tenant on which the request was made, the user who is
    // authenticated to the request (if any). This context is used when invoking request to the APIs
    // in all the modules in the system
    var ctx = req.ctx;
    log().debug("Req POST ");
    log().debug("Requette :"+req.body.description);
    log().debug("Requette Date :"+req.body.date_start);
    log().debug("Requette Conv Date :"+Date.parse(req.body.date_start));
    // Express makes request data for POST requests available on the "body" object of the request
    var title = req.body.title;
    var description = req.body.description;

    var date_start = Date.parse(req.body.date_start);
    var date_end = Date.parse(req.body.date_end);
    var send_mail = Number(req.body.send_mail);
    var level = Number(req.body.level);

            var date_deb = new Date(date_start);
            var date_fin = new Date(date_end);
            
            
            if (date_deb === date_fin){
                var erreur = {'code': 403, 'msg': 'date start is equal date end'};
            //return callback({'code': 401, 'msg': 'date start is equel date end'});
            res.send(erreur.code, erreur.msg);
            log().debug("Req Post error :");
            log().debug("code error :"+erreur.code);
            log().debug("message error :"+erreur.msg);
            return;
            }else if (date_start > date_end) {
            //return callback({'code': 402, 'msg': 'date start > date end'});
            var erreur = {'code': 402, 'msg': 'date start > date end'};
            res.send(erreur.code, erreur.msg);
            log().debug("Req Post error :");
            log().debug("code error :"+erreur.code);
            log().debug("message error :"+erreur.msg);
            return;
            }else {
                
           
    // Call the API to add a globale message to the gms list of the user in context
    GlobaleMsgAPI.addGms(ctx, title, description, date_start, date_end, send_mail, level, function(err, gms) {
        if (err) {
            // If there was any error adding the message, respond with the error code and message
            log().debug("Error Create Gms :",err.code);
            log().debug("Error Create Gms :",err.msg);
            res.send(err.code, err.msg);
            return;
        }
        
        // We successfully created the task, send its model to the client
        log().debug("Ok Create Gms :",gms);
        res.send(gms);
    });
}
});

/**
 * Handle a "delete" request that deletes a global message from the current user's global message list
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
    log().debug("REST DELETE Hilary");
    // Call the API to delete the task from the task list of the user in context
    GlobaleMsgAPI.deleteGms(ctx, created, function(err) {
        if (err) {
            // If there was any error deleting the task, respond with the error code and message
            res.send(err.code, err.msg);
            log().debug("Code error :",err.code);
            log().debug("Message error :",err.msg);
            return;
        }

        // We successfully deleted the task, reply with a 200 HTTP status code and no body
        res.send();
    });
});


