
// inicializamos _ para usar lodash (en client y server) ...
import lodash from 'lodash';
_ = lodash

Accounts.onCreateUser(function(options, user) {
    // debugger;
  // para agregar el rol 'admin' cuando el usuario crea el administrador
  if (user.emails && _.some(user.emails, (email) => { return email.address === 'admin@admin.com'; } )) {
      if (!user.roles || !_.some(user.roles, (rol) => { return rol === 'admin'; } )) {
          user.roles = [];
          user.roles.push('admin');
      };
  };

  return user;
});

Meteor.startup(function() {
    FS.TempStore.setMaxListeners(0);
});
