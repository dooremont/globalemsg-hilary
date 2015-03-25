//Mail
//
var PrincipalsUtil = require('oae-principals/lib/util');
var PrincipalsDAO = require('oae-principals/lib/internal/dao');
var _ = require('underscore');
var util = require('util');
var TenantsAPI = require('oae-tenants');
var log = require('oae-logger').logger('oae-globalemsg-rest');
var EmailAPI = require('oae-email');

exports.mailUsersFromTenant = function(tenantAlias,data ,callback) {
var data = data;
    // Gets called for every 50 principals
    var handlePrincipals = function(principals, next) {
        // The `principals` set can contain groups, we just need the users
        var users = _.filter(principals, function(principal) {  
            return PrincipalsUtil.isUser(principal.principalId);
        });    
        // Send out the emails and move on to the next set of users when done
        mailUsers(users,data, next);
    };

    PrincipalsDAO.iterateAll(['principalId', 'tenantAlias', 'displayName', 'publicAlias', 'locale', 'emailPreference', 'email'], 50, handlePrincipals, function(err) {
        if (err) {
            log().debug("iterateAll Erreur :",err);
        }
        return callback();
    });
};

var mailUsers = function(users,gms,callback) {
    

    if (_.isEmpty(users)) {
        
        return callback();
    }


    var user = users.pop();
    user.tenant = { alias: user.tenantAlias, displayName: user.tenantAlias };
    user.id = user.principalId;
    

    //var data = { /* data that's needed in the email template */ };
   
   // EmailAPI.sendEmail('oae-globalemsg', 'gms', user, gms, null, function(err, message) {
   
   if (_.isEmpty(user)) {
        return callback();
    }

var emailHash = util.format('%s#', user.principalId);
            emailHash += util.format('%s#',gms.title.length);
            emailHash += util.format('%s#',gms.description.length);
            emailHash += util.format('%s#',gms.date_start);
            emailHash += util.format('%s#',gms.date_end);
            emailHash += util.format('%s#',gms.created);
    EmailAPI.sendEmail('oae-globalemsg', 'gms', user, gms, {'hash': emailHash}, function(err,message) {
         if (err) {

                                               log().debug("sendEmail Erreur  à :",user.email);
                                               log().debug("Erreur sendEmail ",err,message);
           
          }else{
              log().debug("Email sended",user.email);
              log().debug("Ok ",err,message);
              //log().debug("GMD",gms);
              mailUsers(users, gms, callback);
         }
     });
};