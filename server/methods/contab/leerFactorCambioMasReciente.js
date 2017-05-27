
Meteor.methods(
{
    leerFactorCambioMasReciente: function (fecha) {
        // debugger;
        check(fecha, Date);
        let factorCambio = ContabFunctions.leerCambioMonedaMasReciente(fecha);
        return factorCambio;
    }
});
