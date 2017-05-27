
import numeral from 'numeral';

Meteor.methods(
{
    'contab.cloneCatalogoCuentasContables': function () {

        // copiamos (clon) el catálogo de cuentas contables en el 'dumb' collection CuentasContables2; la idea es, luego,
        // persistirlo en el client para que sirva como un cache de este catálogo
        let conta = CuentasContables.find().count();

        CuentasContables2.remove({});

        CuentasContables.find().forEach((x) => {
            CuentasContables2.insert(x);
        });

        return `Ok, el catálogo de cuentas contables ha sido copiado. En total se han copiado
                ${numeral(conta).format('0,0')} cuentas contables.`;
    }
});
