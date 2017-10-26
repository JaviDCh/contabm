
import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';

// ---------------------------------------------------------------------------------------------------
// tal como existe en mongodb, Bancos contiene Agencias y, cada agencia, contiene Cuentas bancarias
// la función que sigue intenta crear un array en el cual cada item es una cuenta bancaria con sus
// datos más importantes: banco, moneda, etc.

let flattenBancos = function (ciaContab) {

    let cuentasBancarias = [];

    let monedas = Monedas.find().fetch();
    let bancos = Bancos.find().fetch();
    let companias = Companias.find().fetch();

    _.each(Bancos.find().fetch(), (banco) => {

        if (banco.agencias && _.isArray(banco.agencias) && banco.agencias.length) {
            _.each(banco.agencias, (agencia) => {

                if (agencia.cuentasBancarias && _.isArray(agencia.cuentasBancarias) && agencia.cuentasBancarias.length) {
                    _.each(agencia.cuentasBancarias, (cuenta) => {
                        // puede o no venir una ciaContab ...
                        if (ciaContab && cuenta.cia === ciaContab.numero) {
                            let cuentaBancaria = {
                                cuentaInterna: cuenta.cuentaInterna,
                                cuentaBancaria: cuenta.cuentaBancaria,
                                cuentaContable: cuenta.cuentaContable ? cuenta.cuentaContable : null,
                                moneda: cuenta.moneda,
                                simboloMoneda: _.find(monedas, (x) => { return x.moneda === cuenta.moneda; }).simbolo,
                                banco: banco.banco,
                                nombreBanco: _.find(bancos, (x) => { return x.banco === banco.banco; }).abreviatura,
                                cia: cuenta.cia,
                                nombreCia: _.find(companias, (x) => { return x.numero === cuenta.cia; }).abreviatura,
                            };
                            cuentasBancarias.push(cuentaBancaria);
                        } else if (!ciaContab) {
                            let cuentaBancaria = {
                                cuentaInterna: cuenta.cuentaInterna,
                                cuentaBancaria: cuenta.cuentaBancaria,
                                cuentaContable: cuenta.cuentaContable ? cuenta.cuentaContable : null,
                                moneda: cuenta.moneda,
                                simboloMoneda: _.find(monedas, (x) => { return x.moneda === cuenta.moneda; }).simbolo,
                                banco: banco.banco,
                                nombreBanco: _.find(bancos, (x) => { return x.banco === banco.banco; }).abreviatura,
                                cia: cuenta.cia,
                                nombreCia: _.find(companias, (x) => { return x.numero === cuenta.cia; }).abreviatura,
                            };
                            cuentasBancarias.push(cuentaBancaria);
                        };
                    });
                };
            });
        };
    });

    return cuentasBancarias;
};

FuncionesGlobalesBancos.flattenBancos = flattenBancos;
