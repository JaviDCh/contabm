

let mensajeErrorDesdeMethod_preparar = (errorFromMeteorMethod) => {

    // preparamos el mensaje de error que debe ser mostrado al usuario, cuando un Meteor Method falla
    // con un objeto 'error' ...

    let err = errorFromMeteorMethod;

    let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";

    if (err.error && err.errorType && err.reason) {
        errorMessage += `<br />(${err.errorType}: ${err.error}) - ${err.reason}`;
    } else if (err.errorType && err.reason) {
      errorMessage += `<br />(${err.errorType}) - ${err.reason}`;
    } else if (err.reason){
      errorMessage += `<br />${err.reason}`;
    } else if (err.errorType) {
      errorMessage += `<br />${err.errorType}`;
    }

    if (err.details) {
        errorMessage += "<br />" + err.details;
    }

    return errorMessage;
}

ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar = mensajeErrorDesdeMethod_preparar;
