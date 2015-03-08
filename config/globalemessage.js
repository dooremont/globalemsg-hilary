var Fields = require('oae-config/lib/fields');

module.exports = {
    'title': 'OAE Globale message Module',
    'GlobaleMessage': {
        'name': 'Globale Message',
        'description': 'Globale Message Configuration',
        'elements': {
            'enabled': new Fields.Bool('Globale Message enabled', 'Whether or not users admin can use Globale message for tenant', false)
        }
    }
};
