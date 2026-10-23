exports.enviarMensaje = async (texto) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.log("Telegram no está configurado en el .env");
        return;
    }

    const url = "https://api.telegram.org/bot" + token + "/sendMessage";

    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
            signal: AbortSignal.timeout(8000)
        });

        if (!respuesta.ok) {
            console.log("Telegram respondió " + respuesta.status);
        }
    } catch (err) {
        console.log("No se pudo enviar el mensaje a Telegram: " + err.message);
    }
};

function limpiar(texto) {
    return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function dinero(monto) {
    return "Q " + Number(monto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

exports.mensajeVenta = (venta, concierto, artista, estadio) => {
    let boletos = "";
    for (const b of venta.boletos) {
        if (b.dePie) {
            boletos += "\n• " + limpiar(b.localidad) + " (de pie) · " + dinero(b.precio);
        } else {
            boletos += "\n• " + limpiar(b.localidad) + " · Bloque " + b.bloque + " · Fila " + b.fila + " · Asiento " + b.numero + " · " + dinero(b.precio);
        }
    }

    let pago = "Efectivo";
    if (venta.metodoPago === "TARJETA") {
        pago = "Tarjeta (aut. " + limpiar(venta.autorizacion) + ")";
    }

    let cliente = "Consumidor Final";
    if (venta.cliente) {
        cliente = limpiar(venta.cliente.nombre) + " (NIT " + limpiar(venta.cliente.nit) + ")";
    }

    return "🎟️ <b>Nueva venta " + venta.numero + "</b>\n\n"
        + "<b>Concierto:</b> " + (artista ? limpiar(artista.nombre) : "Sin artista") + " · " + (concierto.gira ? limpiar(concierto.gira) : "Sin gira") + "\n"
        + "<b>Recinto:</b> " + (estadio ? limpiar(estadio.nombre) : "Sin recinto") + "\n"
        + "<b>Vendedor:</b> " + limpiar(venta.vendedor) + "\n"
        + "<b>Cliente:</b> " + cliente + "\n\n"
        + "<b>Boletos (" + venta.boletos.length + "):</b>" + boletos + "\n\n"
        + "<b>Total:</b> " + dinero(venta.total) + " · " + pago;
};
