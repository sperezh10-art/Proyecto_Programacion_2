const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

function crearTransporte() {
    const usuario = process.env.CORREO_USUARIO;
    const clave = process.env.CORREO_CLAVE;

    if (!usuario || !clave) {
        console.log("El correo no está configurado en el .env");
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user: usuario, pass: clave }
    });
}

const LOGO = { filename: "logo.png", path: __dirname + "/../recursos/logo.png", cid: "logo" };

function limpiar(texto) {
    return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plantilla(titulo, contenido) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#0A0908;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0908; padding:32px 12px; font-family:Arial, Helvetica, sans-serif;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%; background:#141311; border:1px solid #2A2825; border-radius:16px;">
          <tr>
            <td style="padding:24px 28px; border-bottom:1px solid #2A2825;">
              <img src="cid:logo" width="38" height="38" alt="Billets" style="vertical-align:middle; border:0;">
              <span style="color:#F3EFE6; font-weight:bold; font-size:18px; vertical-align:middle; margin-left:8px;">Billets</span>
              <span style="color:#8C8679; font-size:12px; margin-left:10px;">Taquilla V1.0</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <div style="color:#F3EFE6; font-size:26px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">${titulo}</div>
              ${contenido}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; border-top:1px solid #2A2825; color:#8C8679; font-size:11px;">
              Este correo se envió automáticamente desde la taquilla Billets. No respondas a este mensaje.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

exports.enviarCodigo = async (destino, nombre, codigo) => {
    const transporte = crearTransporte();
    if (!transporte) {
        return false;
    }

    let cajas = "";
    for (const digito of String(codigo)) {
        cajas += `<td style="width:44px; height:56px; background:#1D1C19; border:1px solid #3A3833; border-radius:10px; color:#FFB020; font-size:28px; font-weight:bold; text-align:center;">${digito}</td><td style="width:8px;"></td>`;
    }

    const contenido = `
              <p style="color:#CFC9BC; font-size:14px; line-height:1.5; margin:14px 0 22px;">
                Hola ${limpiar(nombre)}, recibimos una solicitud para cambiar tu contraseña.
                Escribe este código en la taquilla:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr>${cajas}</tr></table>
              <p style="color:#ABA597; font-size:13px; line-height:1.5; margin:0;">
                El código vence en <b style="color:#F3EFE6;">10 minutos</b> y solo se puede usar una vez.
              </p>
              <p style="color:#8C8679; font-size:12px; line-height:1.5; margin:18px 0 0; padding:12px 14px; background:#1D1C19; border-radius:10px;">
                Si no fuiste tú, ignora este correo. Tu contraseña no cambiará.
              </p>`;

    try {
        await transporte.sendMail({
            from: "Billets Taquilla <" + process.env.CORREO_USUARIO + ">",
            to: destino,
            subject: "Tu código para cambiar la contraseña: " + codigo,
            html: plantilla("Código de verificación", contenido),
            attachments: [LOGO]
        });
        return true;
    } catch (err) {
        console.log("No se pudo enviar el correo: " + err.message);
        return false;
    }
};

exports.enviarBienvenida = async (destino, datos) => {
    const transporte = crearTransporte();
    if (!transporte) {
        return false;
    }

    let rol = "Vendedor";
    if (String(datos.rol || "").toUpperCase().startsWith("ADMIN")) {
        rol = "Administrador";
    }

    const fila = (titulo, valor, color) => `
                <tr>
                  <td style="padding:12px 18px; color:#8C8679; font-size:12px; border-bottom:1px solid #2E2C28;">${titulo}</td>
                  <td style="padding:12px 18px; color:${color}; font-size:14px; font-weight:bold; text-align:right; border-bottom:1px solid #2E2C28;">${limpiar(valor)}</td>
                </tr>`;

    const contenido = `
              <p style="color:#CFC9BC; font-size:14px; line-height:1.5; margin:14px 0 20px;">
                Hola ${limpiar(datos.nombre)}, ya tienes una cuenta en la taquilla Billets. Estos son tus datos para entrar:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1D1C19; border:1px solid #2E2C28; border-radius:12px;">
                ${fila("Nombre completo", datos.nombre, "#F3EFE6")}
                ${fila("Usuario", datos.usuario, "#F3EFE6")}
                ${fila("Rol", rol, "#F3EFE6")}
                <tr>
                  <td style="padding:12px 18px; color:#8C8679; font-size:12px;">Contraseña</td>
                  <td style="padding:12px 18px; color:#FFB020; font-size:16px; font-weight:bold; text-align:right; font-family:monospace;">${limpiar(datos.contrasena)}</td>
                </tr>
              </table>
              <p style="color:#F3EFE6; font-size:13px; line-height:1.5; margin:18px 0 0; padding:12px 14px; background:rgba(255,176,32,0.12); border:1px solid #FFB020; border-radius:10px;">
                <b style="color:#FFB020;">Importante:</b> esta contraseña es temporal. Cámbiala lo más pronto posible desde
                "Cambiar mi contraseña" en la pantalla de inicio de sesión, y no la compartas con nadie.
              </p>`;

    try {
        await transporte.sendMail({
            from: "Billets Taquilla <" + process.env.CORREO_USUARIO + ">",
            to: destino,
            subject: "Bienvenido a Billets, " + datos.nombre,
            html: plantilla("Bienvenido", contenido),
            attachments: [LOGO]
        });
        return true;
    } catch (err) {
        console.log("No se pudo enviar el correo de bienvenida: " + err.message);
        return false;
    }
};

function dinero(monto) {
    return "Q " + Number(monto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fechaConcierto(concierto) {
    let texto = "";
    if (concierto.fecha) {
        let fecha = String(concierto.fecha);
        if (concierto.fecha instanceof Date) {
            fecha = concierto.fecha.toISOString();
        }
        const partes = fecha.substring(0, 10).split("-");
        texto = partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    if (concierto.hora) {
        texto += " · " + String(concierto.hora).substring(0, 5) + " h";
    }
    return texto;
}

exports.enviarBoletos = async (destino, venta, concierto, artista, estadio, factura) => {
    const transporte = crearTransporte();
    if (!transporte) {
        return false;
    }

    const nombreArtista = artista ? limpiar(artista.nombre).toUpperCase() : "CONCIERTO";
    const gira = concierto.gira ? limpiar(concierto.gira) : "";
    const recinto = estadio ? limpiar(estadio.nombre) : "";
    const cuando = fechaConcierto(concierto);

    const adjuntos = [];
    let tarjetas = "";

    for (let i = 0; i < venta.boletos.length; i++) {
        const b = venta.boletos[i];
        const imagen = await QRCode.toBuffer(b.codigo, { width: 220, margin: 1 });
        adjuntos.push({ filename: "qr-" + b.codigo + ".png", content: imagen, cid: "qr" + i });

        let lugar = "Acceso general · De pie";
        if (!b.dePie) {
            lugar = "Bloque " + limpiar(b.bloque) + " · Fila " + limpiar(b.fila) + " · Asiento " + b.numero;
        }

        tarjetas += `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EFE6; border-radius:14px; margin:0 0 14px;">
                <tr>
                  <td style="padding:16px 18px; vertical-align:top;">
                    <div style="color:#8C8679; font-size:10px; letter-spacing:1px;">Billets · BOLETO DE ACCESO</div>
                    <div style="color:#141311; font-size:20px; font-weight:bold; margin:4px 0 2px;">${nombreArtista}</div>
                    <div style="color:#57534B; font-size:12px;">${cuando}${recinto ? " · " + recinto : ""}</div>
                    <div style="margin:14px 0 6px;">
                      <span style="background:#FFB020; color:#1C1404; font-size:12px; font-weight:bold; padding:4px 10px; border-radius:6px;">${limpiar(b.localidad)}</span>
                      <span style="color:#141311; font-size:14px; font-weight:bold; margin-left:8px;">${dinero(b.precio)}</span>
                    </div>
                    <div style="color:#141311; font-size:12px;">${lugar}</div>
                  </td>
                  <td width="130" style="padding:12px; text-align:center; border-left:2px dashed #CFC9BC;">
                    <img src="cid:qr${i}" width="110" height="110" alt="QR" style="display:block; margin:0 auto;">
                    <div style="color:#57534B; font-size:10px; margin-top:6px;">${limpiar(b.codigo)}</div>
                  </td>
                </tr>
              </table>`;
    }

    let pago = "Efectivo";
    if (venta.metodoPago === "TARJETA") {
        pago = "Tarjeta";
    }

    let avisoFactura = "";
    if (factura) {
        adjuntos.push({ filename: factura.numero + ".pdf", content: factura.pdf, contentType: "application/pdf" });
        avisoFactura = `
              <p style="color:#CFC9BC; font-size:13px; line-height:1.5; margin:16px 0 0; padding:12px 14px; background:#1D1C19; border:1px solid #2E2C28; border-radius:10px;">
                Tu factura <b style="color:#FFB020;">${limpiar(factura.numero)}</b> va adjunta en PDF.
              </p>`;
    }

    const contenido = `
              <p style="color:#CFC9BC; font-size:14px; line-height:1.5; margin:12px 0 4px;">
                ¡Gracias por tu compra${venta.cliente && venta.cliente.nombre && venta.cliente.nit !== "CF" ? ", " + limpiar(venta.cliente.nombre) : ""}! Aquí están tus boletos para
                <b style="color:#F3EFE6;">${nombreArtista}</b>${gira ? " · " + gira : ""}.
              </p>
              <p style="color:#8C8679; font-size:12px; margin:0 0 20px;">Venta ${venta.numero} · ${venta.boletos.length} ${venta.boletos.length === 1 ? "boleto" : "boletos"}</p>
              ${tarjetas}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0; border-top:1px solid #2A2825;">
                <tr>
                  <td style="padding:14px 0 0; color:#ABA597; font-size:13px;">Total pagado · ${pago}</td>
                  <td style="padding:14px 0 0; color:#FFB020; font-size:22px; font-weight:bold; text-align:right;">${dinero(venta.total)}</td>
                </tr>
              </table>
              ${avisoFactura}
              <p style="color:#8C8679; font-size:12px; line-height:1.5; margin:18px 0 0; padding:12px 14px; background:#1D1C19; border-radius:10px;">
                Presenta el QR de cada boleto en la entrada, en el celular o impreso. Cada código solo se puede usar una vez.
              </p>`;

    try {
        await transporte.sendMail({
            from: "Billets Taquilla <" + process.env.CORREO_USUARIO + ">",
            to: destino,
            subject: "Tus boletos para " + (artista ? artista.nombre : "el concierto") + " · " + venta.numero,
            html: plantilla("Tus boletos", contenido),
            attachments: [LOGO].concat(adjuntos)
        });
        return true;
    } catch (err) {
        console.log("No se pudo enviar el correo de boletos: " + err.message);
        return false;
    }
};
