
var gmsStore = {};
var ConfigAPI = require('oae-config');
var PrincipalsConfig = ConfigAPI.config('oae-globalemsg');
var log = require('oae-logger').logger('oae-globalemsg-rest');

// Import the Cassandra storage API
var Cassandra = require('oae-util/lib/cassandra');
/**
 * Add a globale message to the current user's task list
 *
 * @param  {Context}    ctx             The context of the current request
 * @param  {String}     displayName     The name to represent the task in brief listings
 * @param  {String}     description     The full description / instructions of the task
 * @param  {Function}   callback        Invoked when the process completes
 * @param  {Object}     callback.err    An error that occurred, if any
 * @param  {Object}     callback.task   The task that was added to the user's task list
 */

// Todo generéer le commentaire
/**
 * [addGms description]
 * @param {Context}     ctx
 * @param {String}      title
 * @param {String}      description
 * @param {BigInt}      date_start
 * @param {Bigint}      date_end
 * @param {[type]}
 * @param {[type]}
 * @param {Function}
 */
module.exports.addGms = function(ctx, title, description, date_start, date_end, send_mail, level, callback) {
    // Get the user of the current request
    var user = ctx.user();

    // Anonymous users cannot create tasks
    if (!ctx.user()) {
        return callback({'code': 401, 'msg': 'Anonymous users cannot create globale message'});
    }
//
// Savoir si l'utilisateur est admin du tenant
//
// Todo  return callback({'code': 401, 'msg': 'Only Admin users can create globale message'});
 // If the Terms and Conditions have not been enabled, the user can't accept anything
    var isEnabled = PrincipalsConfig.getValue(ctx.tenant().alias, 'GlobaleMessage', 'enabled');
    if (!isEnabled) {
        return false;
    }

    // Only Admins use globale message
    var isAdmin = ctx.user().isAdmin(ctx.tenant().alias);
    if (!isAdmin) {
        return false;
    }


    // Push the new gms onto the current user's gms list
    var gms = {
        'userId': user.id,
        'title': title,
        'description': description,
        'date_start':  date_start,
        'date_end': date_end,
        'send_mail': send_mail,
        'level': level,
        'created': Date.now()
    };
 
     // Persist the task object into Cassandra
    var cql = 'INSERT INTO "Gms" ("userId", "title", "description", "date_start", "date_end", "send_mail", "level", "created") VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    var parameters = [
        gms.userId,
        gms.title,
        gms.description,
        gms.date_start,
        gms.date_end,
        gms.send_mail,
        gms.level,
        gms.created
    ];
    log().info("Cassandra requette :"+parameters);
    Cassandra.runQuery(cql, parameters, function(err) {
        if (err) {
            log().info("Cassandra Erreur :"+err);
            return callback(err);
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
 * @param  {Object}     callback.tasksInfo  An object containing the list of tasks owned by the current user
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
            log().info("Cassandra list :"+gms);
            log().info("Cassandra list row :"+row);
            // Add the task to the tasks array
            gmss.push(gms);
        });

        // Respond with the user's task list
        return callback(null, {'gmss': gmss});
    });
};



/**
 * Delete a task from the current user's task list
 *
 * @param  {Context}    ctx                 The context of the current request
 * @param  {Number}     created             The `created` time of the task to delete
 * @param  {Function}   callback            Invoked when the process completes
 * @param  {Object}     callback.err        An error that occurred, if any
 * @param  {Object}     callback.tasksInfo  An object containing the list of tasks owned by the current user
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
    log().info("Cassandra Delete :"+parameters);
    Cassandra.runQuery(cql, parameters, callback);
};
