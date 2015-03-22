var PrincipalsUtil = require('oae-principals/lib/util');
var PrincipalsDAO = require('oae-principals/lib/internal/dao');
var mailUsersFromTenant = function(tenantAlias, callback) {


    // Gets called for every 50 principals
    var handlePrincipals = function(principals, next) {
        // The `principals` set can contain groups, we just need the users
        var users = _.filter(principals, function(principal) {
            return PrincipalsUtil.isUser(principal.principalId);
        });

        // Send out the emails and move on to the next set of users when done
        mailUsers(users, next);
    };

    PrincipalsDAO.iterateAll(['principalId', 'tenantAlias', 'displayName', 'email'], 50, handlePrincipals, function(err) {
        if (err) {
            //...
        }

        log().info('All done');
        return callback();
    });
};

var mailUsers = function(users, callback) {
    if (_.isEmpty(users)) {
        return callback();
    }

    var user = users.pop();
    var data = { /* data that's needed in the email template */ };
    EmailAPI.sendEmail('oae-my-module', 'name-of-my-mail-template', user, data, {}, function(err) {
        if (err) {
            //...
        }

     


        mailUsers(users, callback);
    });
};
