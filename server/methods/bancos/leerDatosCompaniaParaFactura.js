
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    leerDatosCompaniaParaFactura: function (pk) {

        new SimpleSchema({
            pk: { type: Number, optional: false }
          }).vali

        let query = `Select Ciudad as ciudad, AplicaIvaFlag as aplicaIvaFlag,
                     ContribuyenteEspecialFlag as contribuyenteEspecialFlag,
                     BaseRetencionISLR as baseRetencionISLR,
                     CodigoConceptoRetencion as codigoConceptoRetencion, PorcentajeDeRetencion as porcentajeDeRetencion,
                     RetencionIslrSustraendo as retencionIslrSustraendo, SujetoARetencionFlag as sujetoARetencionFlag,
                     NuestraRetencionSobreIvaPorc as nuestraRetencionSobreIvaPorc
                     From Proveedores Where Proveedor = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pk.toString(), ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!_.isArray(response.result) || !response.result.length) {
            return {
                error: true,
                message: `Error: hemos obtenido un error al intentar leer la compañía desde la base de datos.
                Por favor revise.`,
            }
        }

        let proveedor = response.result[0];

        if (!proveedor.ciudad) {
            return {
                error: true,
                message: `Error: la compañía indicada no tiene una ciudad asociada en el registro
                          efectuado en la tabla de compañías.<br />
                          Ud. debe revisar los datos registrados para la compañía en
                          <em>Bancos / Catálogos / Proveedores - clientes</em> y asignar una ciudad a esta
                          compañía.`,
            }
        }

        return JSON.stringify(proveedor);
    }
});
