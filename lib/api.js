
var gmsStore = {};
var ConfigAPI = require('oae-config');
var PrincipalsConfig = ConfigAPI.config('oae-globalemsg');
var log = require('oae-logger').logger('oae-globalemsg-rest');
var EmailAPI = require('oae-email');
var _ = require('underscore');
var util = require('util');
var TenantsAPI = require('oae-tenants');
// Import the Cassandra storage API
var Cassandra = require('oae-util/lib/cassandra');
var mailAPI = require('./mail');




/**
 * addGms Add a global message to the current tenant "global message" list
 * @param {Context}     ctx          The context of the current request
 * @param {String}      title        The title of global message 
 * @param {String}      description  The full description
 * @param {BigInt}      date_start   The start date to show the message 
 * @param {Bigint}      date_end     The end date to show the message   
 * @param {int}         send_mail    Force to send mail 1 = Yes  0 = No
 * @param {int}         Level        The level message 1 => Normal  , 2 => Warning , 3 => Critical 
 * @param {Object}     callback.err    An error that occurred, if any
 * @param {Object}     callback.gms   The global message that was added to the gms list
 */
module.exports.addGms = function(ctx, title, description, date_start, date_end, send_mail, level, callback) {
    // Get the user of the current request
    var user = ctx.user();
    // Anonymous users cannot create message
    if (!ctx.user()) {
        return callback({'code': 401, 'msg': 'Anonymous users cannot create globale message'});
    }
//
// Savoir si l'utilisateur est admin du tenant
//
// Todo  return callback({'code': 401, 'msg': 'Only Admin users can create globale message'});
 
    var isEnabled = PrincipalsConfig.getValue(ctx.tenant().alias, 'GlobaleMessage', 'enabled');
    log().debug("isEnabled :",isEnabled);
    if (!isEnabled) {
        log().debug("isEnabled");
        return false;
    }

    // Only Admins use globale message
    var isAdmin = ctx.user().isAdmin(ctx.tenant().alias);
    log().debug("isAdmin :",isAdmin);
    if (!isAdmin) {
        return callback({'code': 401, 'msg': 'Only Admins can create globale message'});
        //return false;
    }
    var isGlobalAdmin = ctx.user().isGlobalAdmin();
    log().debug("isGlobalAdmin :",isGlobalAdmin);
    if (isGlobalAdmin) {
        log().info("the Global Admins cannot create globale message");
        return callback({'code': 401, 'msg': 'the Global Admins cannot create globale message'});
        //return false;
    }

    // Push the new gms onto the current tenant gms list
    var gms = {
        'userId': user.id,
        'title': title,
        'description': description,
        'date_start':  date_start,
        'date_end': date_end,
        'send_mail': send_mail,
        'level': level,
        'Alias_tenant': ctx.tenant().alias,
        'created': Date.now()
    };
 log().debug("Create gms object :",gms);
         
     // Persist the global message object into Cassandra
    var cql = 'INSERT INTO "Gms" ("userId", "title", "description", "date_start", "date_end", "send_mail", "level", "Alias_tenant", "created") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var parameters = [
        gms.userId,
        gms.title,
        gms.description,
        gms.date_start,
        gms.date_end,
        gms.send_mail,
        gms.level,
        gms.Alias_tenant,
        gms.created
    ];
    log().debug("Cassandra requette :"+parameters);
    Cassandra.runQuery(cql, parameters, function(err) {
        if (err) {
            log().debug("Cassandra Erreur :"+err);
            return callback(err);
        }
        if (gms.level === 1){
            var mail = user.email
            log().debug("Envoie de mail :");
            log().debug("Envoie de mail  à :",mail);

 // Construct the data that needs to go into the email template
  /*      var data = {
            'activities': adaptedActivities,
            'tenant': tenant,
            'user': user,
            'baseUrl': TenantsUtil.getBaseUrl(tenant),
            'skinVariables': UIAPI.getTenantSkinVariables(tenant.alias),
            'timezone': timezone
        };
        return EmailAPI.sendEmail('oae-activity', 'mail', user, data, {'hash': emailHash}, callback);
*/
log().debug("Envoie USER :",user);
           EmailAPI.sendEmail('oae-globalemsg', 'gms', user, gms, null, function(err, message) {
                                       if (err){
                                               log().debug("Envoie de mail  à :",user.email);
                                               log().debug("Erreur ",err,message);
                                       }else{
                                               log().debug("Envoie de mail  à :",user.email);
                                               log().debug("Ok ",err,message);
                                               log().debug("ADMIN USER",user);
                                       }});
log().debug("Octx.tenant().alias,gms ",ctx.tenant().alias,gms);
        mailAPI.mailUsersFromTenant(ctx.tenant().alias,gms);
        }
    // Respond with the created task
    return callback(null, gms);
});
};
/**
 * Get the current user's list of gms
 *
 * @param  {Context}    ctx                 The context of the current request
 * @param  {Function}   callback            Invoked when the process completes
 * @param  {Object}     callback.err        An error that occurred, if any
 * @param  {Object}     callback.gmss  An object containing the list of global messages owned by the current user
 */

module.exports.listGms = function(ctx, callback) {
    // Get the user of the current request
    var user = ctx.user();

    // Anonymous users don't have tasks
    if (!ctx.user()) {
        return callback({'code': 401, 'msg': 'Anonymous users cannot list their tasks'});
    }

    // Query the tasks from Cassandra
    var cql = 'SELECT * FROM "Gms" WHERE "userId" = ? ORDER BY "created" DESC';
   // var cql = 'SELECT * FROM "Gms" WHERE "userId" = ?';
    var parameters = [user.id];
    Cassandra.runQuery(cql, parameters, function(err, rows) {
        if (err) {
            return callback(err);
        }

        // Iterate over all rows returned by Cassandra and add the tasks to the tasks array
        var gmss = [];
        rows.forEach(function(row) {
            // A row is a list of columns (userId, displayName, etc...). This utility function will
            // convert that list of columns into an object of key -> value
            var gms = Cassandra.rowToHash(row);
            log().debug("Cassandra list :"+gms);
            log().debug("Cassandra list row :"+row);
            // Add the task to the tasks array
            for (id in gms){
                log().debug("Cassandra id :",id," ",gms[id]);
            }
            gmss.push(gms);
        });


        // Respond with the user's task list
        return callback(null, {'gmss': gmss});
    });
};



module.showGms = function(ctx,callback){
    var user = ctx.user();
    if (!ctx.user()) {
        return callback({'code': 401, 'msg': 'Anonymous users cannot list their tasks'});
    }
    var datetoday = Date.now();
    var parameters = [datetoday];
    var cql = 'SELECT * FROM "Gms" WHERE "created" < ? ';
    Cassandra.runQuery(cql, parameters, function(err, rows) {
        if (err) {
            log().debug("Cassandra Error SELECT * FROM Gms WHERE created :"+err);
            return callback(err);
        }
        var ListgmsAviables = [];
        rows.forEach(function(row) {
            var msg = Cassandra.rowToHash(row);
            ListgmsAviables.push(msg);
        });
    });


};


/**
 * Delete a global message from the current user's gms list
 *
 * @param  {Context}    ctx                 The context of the current request
 * @param  {Number}     created             The `created` time of the gms to delete
 * @param  {Function}   callback            Invoked when the process completes
 * @param  {Object}     callback.err        An error that occurred, if any
 * @param  {Object}     callback.gmss  An object containing the list of global messages owned by the current user
 */
module.exports.deleteGms = function(ctx, created, callback) {
    // Get the user of the current request
    var user = ctx.user();

    // Anonymous users don't have tasks
    if (!ctx.user()) {
        return callback({'code': 401, 'msg': 'Anonymous users cannot delete globale message'});
    }

    // Delete the task from Cassandra, calling back directly to the client
    var cql = 'DELETE FROM "Gms" WHERE "userId" = ? AND "created" = ? ';
    var parameters = [user.id, created];
    log().debug("Cassandra Delete :"+parameters);
    Cassandra.runQuery(cql, parameters, callback);
};
