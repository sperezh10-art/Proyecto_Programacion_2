exports.buscarNit = async (nit) => {
    const baseUrl = process.env.FELPLEX_BASE_URL;
    const empresa = process.env.FELPLEX_EMPRESA;
    const apiKey = process.env.FELPLEX_API_KEY;

    if (!baseUrl || !empresa || !apiKey) {
        console.log("FELplex no está configurado en el .env");
        return null;
    }

    const url = baseUrl + "/api/entity/" + empresa + "/find/NIT/" + encodeURIComponent(nit);

    try {
        const respuesta = await fetch(url, {
            headers: { "Accept": "application/json", "X-Authorization": apiKey },
            signal: AbortSignal.timeout(8000)
        });

        if (!respuesta.ok) {
            console.log("FELplex respondió " + respuesta.status + " para el NIT " + nit);
            return null;
        }

        const datos = await respuesta.json();
        const contribuyente = Array.isArray(datos) ? datos[0] : datos;

        if (!contribuyente || !contribuyente.tax_name) {
            return null;
        }

        return {
            nombre: ordenarNombre(contribuyente.tax_name),
            correo: contribuyente.emails && contribuyente.emails.length > 0 ? contribuyente.emails[0] : null
        };
    } catch (err) {
        console.log("No se pudo consultar FELplex: " + err.message);
        return null;
    }
};

function ordenarNombre(taxName) {
    const partes = taxName.split(",");
    if (partes.length !== 2) {
        return taxName.trim();
    }
    return (partes[1].trim() + " " + partes[0].trim()).replace(/\s+/g, " ");
}