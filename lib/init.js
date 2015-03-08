// Get a named logger so we can post messages in the log
var log = require("oae-logger").logger("oae-globalemsg-init");

// Import the Cassandra storage API
var Cassandra = require('oae-util/lib/cassandra');

/**
 * Initialize the module on application startup. This is run once during startup and will not
 * be run again during the lifetime of the server. Here you can:
 *
 *  * Initialize module configuration, the `config` object is the full `config.js` configuration
 *  * Initialize Cassandra Tables (data schema)
 *  * Register any integrations in the system such as search and activity entities
 */
module.exports = function(config, callback) {
    log().info("Initializing the oae-globalemsg module");

    // The callback function must be called to tell the OAE container that initialization has
    // completed and it is safe to continue initializing other modules
    // TO DO il faut la  Trouver une Boolean 
    Cassandra.createColumnFamily('Gms', 'CREATE TABLE "Gms" ("userId" text, "title" text, "description" text, "date_start" bigint, "date_end" bigint, "send_mail" int, "level" int, "created" bigint, PRIMARY KEY("userId", "created"))', callback);
    log().info("Creation de la base ",callback);
};

