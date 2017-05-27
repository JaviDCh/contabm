

let mensajeErrorDesdeMethod_preparar = (errorFromMeteorMethod) => {

    // preparamos el mensaje de error que debe ser mostrado al usuario, cuando un Meteor Method falla
    // con un objeto 'error' ...

    let err = errorFromMeteorMethod;

    let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
    if (err.errorType)
        errorMessage += " (" + err.errorType + ")";

    errorMessage += "<br />";

    if (err.message)
        // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
        errorMessage += err.message + " ";
    else {
        if (err.reason)
            errorMessage += err.reason + " ";

        if (err.details)
            errorMessage += "<br />" + err.details;
    };

    if (!err.message && !err.reason && !err.details)
        errorMessage += err.toString();

    return errorMessage;
};

ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar = mensajeErrorDesdeMethod_preparar;
