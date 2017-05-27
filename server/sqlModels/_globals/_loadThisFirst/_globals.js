
import Sequelize from 'sequelize';
// Sequelize = Meteor.npmRequire('sequelize');
const sequelize = new Sequelize(Meteor.settings.sqlServer_db_contab_dbName,
                          Meteor.settings.sqlServer_db_contab_userName,
                          Meteor.settings.sqlServer_db_contab_userPwd, {
    host: 'localhost',
    // instanceName: 'SQLEXPRESS',
    // port: 3306,
    dialect: 'mssql',
    pool: {
        maxConnections: 50,
        minConnections: 0,
        maxIdleTime:    60000
    },
  define: {
        timestamps: false // true by default; para que sequelize no agregue timestaps en forma automática
    },
    dialectOptions: {
      requestTimeout: 30000
    },
    // timezone: '-04:30'      // para 'localizar' las fechas al grabar en sql server; de otra forma, convierte y graba UTC ...
});


// -------------------------------------------------------------------------------------------------------------
var sqlConnection = Async.runSync(function(done) {
    var test = sequelize.authenticate().then(function () { done(null, "conexión exitosa a sql server ..."); })
                                       .catch(function (err) { done(err, null); })
                                       .done();
});

if (sqlConnection.error) {
  // sequelize no pudo conectarse a sql server en forma exitosa
  throw new Meteor.Error(sqlConnection.error && sqlConnection.error.message ? sqlConnection.error.message : sqlConnection.error.toString());
}

export { sequelize };
