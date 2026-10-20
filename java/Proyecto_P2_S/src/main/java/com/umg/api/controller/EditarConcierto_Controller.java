
package com.umg.api.controller;

import com.umg.api.model.Artista;
import com.umg.api.model.Concierto;
import com.umg.api.model.Estadio;
import com.umg.api.service.Artista_Service;
import com.umg.api.service.Concierto_Service;
import com.umg.api.service.Estadio_Service;

import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class EditarConcierto_Controller {

    @FXML private ComboBox<String> cmbArtista;
    @FXML private ComboBox<String> cmbEstadio;
    @FXML private ComboBox<String> cmbEstado;

    @FXML private TextField txtGira;
    @FXML private TextField txtHora;
    @FXML private DatePicker dpFecha;

    @FXML private Label Capacidad;

    @FXML private Button btnGuardar;
    @FXML private Button btnCancelar;
    @FXML private Button cerrar;

    private final Artista_Service artistaService = new Artista_Service();
    private final Estadio_Service estadioService = new Estadio_Service();
    private final Concierto_Service conciertoService = new Concierto_Service();

    private final Concierto conciertoOriginal;
    private final Runnable alGuardar;

    private List<Artista> artistas;
    private List<Estadio> estadios;

    public EditarConcierto_Controller(
            Concierto concierto,
            Runnable alGuardar) {
        this.conciertoOriginal = concierto;
        this.alGuardar = alGuardar;
    }

    @FXML
    private void initialize() {
        cmbEstado.getItems().setAll(
                "En venta",
                "Programado",
                "Agotado",
                "Finalizado",
                "Cancelado"
        );

        btnGuardar.setOnAction(e -> guardarCambios());
        btnCancelar.setOnAction(e -> cerrarVentana());
        cerrar.setOnAction(e -> cerrarVentana());

        cmbEstadio.setOnAction(e -> actualizarCapacidad());

        cargarCatalogos();
    }

    private void cargarCatalogos() {
        try {
            artistas = artistaService.obtenerArtistas();
            estadios = estadioService.obtenerEstadios();

            cmbArtista.getItems().setAll(
                    artistas.stream()
                            .map(Artista::getNombre)
                            .toList()
            );

            cmbEstadio.getItems().setAll(
                    estadios.stream()
                            .map(Estadio::getNombre)
                            .toList()
            );

            cargarDatosOriginales();

        } catch (Exception e) {
            mostrarAlerta(
                    Alert.AlertType.ERROR,
                    "Error",
                    "No fue posible cargar artistas y estadios.\n"
                    + e.getMessage()
            );
        }
    }

    private void cargarDatosOriginales() {
        if (conciertoOriginal == null) {
            return;
        }

        txtGira.setText(conciertoOriginal.getGira());

        if (conciertoOriginal.getFecha() != null) {
            String fecha = conciertoOriginal.getFecha();

            try {
                dpFecha.setValue(
                        LocalDate.parse(fecha.substring(0, 10))
                );
            } catch (Exception e) {
                System.err.println("No se pudo interpretar la fecha: " + fecha);
            }
        }

        if (conciertoOriginal.getHora() != null) {
            String hora = conciertoOriginal.getHora();
            txtHora.setText(
                    hora.length() >= 5 ? hora.substring(0, 5) : hora
            );
        }

        cmbEstado.setValue(conciertoOriginal.getEstado());

        artistas.stream()
                .filter(a -> a.getId() == conciertoOriginal.getArtistaId())
                .findFirst()
                .ifPresent(a -> cmbArtista.setValue(a.getNombre()));

        estadios.stream()
                .filter(s -> s.getId() == conciertoOriginal.getEstadioId())
                .findFirst()
                .ifPresent(s -> cmbEstadio.setValue(s.getNombre()));

        actualizarCapacidad();
    }

    private void actualizarCapacidad() {
        if (estadios == null || cmbEstadio.getValue() == null) {
            return;
        }

        estadios.stream()
                .filter(s -> s.getNombre().equals(cmbEstadio.getValue()))
                .findFirst()
                .ifPresent(s ->
                        Capacidad.setText(s.getCapacidad() + " personas")
                );
    }

    private void guardarCambios() {
        try {
            String gira = txtGira.getText().trim();
            String nombreArtista = cmbArtista.getValue();
            String nombreEstadio = cmbEstadio.getValue();
            LocalDate fecha = dpFecha.getValue();
            String horaTexto = txtHora.getText().trim();
            String estado = cmbEstado.getValue();

            if (gira.isEmpty()
                    || nombreArtista == null
                    || nombreEstadio == null
                    || fecha == null
                    || horaTexto.isEmpty()
                    || estado == null) {
                mostrarAlerta(
                        Alert.AlertType.WARNING,
                        "Campos incompletos",
                        "Completa todos los campos antes de guardar."
                );
                return;
            }

            LocalTime hora = LocalTime.parse(
                    horaTexto,
                    DateTimeFormatter.ofPattern("HH:mm")
            );

            Artista artista = artistas.stream()
                    .filter(a -> a.getNombre().equals(nombreArtista))
                    .findFirst()
                    .orElseThrow(() -> new Exception("Artista no encontrado"));

            Estadio estadio = estadios.stream()
                    .filter(s -> s.getNombre().equals(nombreEstadio))
                    .findFirst()
                    .orElseThrow(() -> new Exception("Estadio no encontrado"));

            Concierto actualizado = new Concierto(
                    conciertoOriginal.getId(),
                    gira,
                    estadio.getId(),
                    hora.format(DateTimeFormatter.ofPattern("HH:mm:ss")),
                    fecha.toString(),
                    artista.getId(),
                    estado
            );

            String respuesta =
            conciertoService.modificarConcierto(actualizado);

            if (respuesta != null
                    && (respuesta.contains("No se pudo actualizar")
                    || respuesta.contains("no fue encontrado"))) {

                mostrarAlerta(
                        Alert.AlertType.WARNING,
                        "No se actualizó",
                        respuesta
                );
                return;
            }

            mostrarAlerta(
                    Alert.AlertType.INFORMATION,
                    "Concierto actualizado",
                    "Los cambios se guardaron correctamente."
            );

            if (alGuardar != null) {
                alGuardar.run();
            }

            cerrarVentana();

        } catch (Exception e) {
            mostrarAlerta(
                    Alert.AlertType.ERROR,
                    "Error al guardar",
                    "No fue posible actualizar el concierto.\n"
                    + e.getMessage()
            );
        }
    }

    private void cerrarVentana() {
        Node nodo = btnCancelar != null ? btnCancelar : cerrar;

        if (nodo != null && nodo.getScene() != null) {
            Stage stage = (Stage) nodo.getScene().getWindow();
            stage.close();
        }
    }

    private void mostrarAlerta(
            Alert.AlertType tipo,
            String titulo,
            String mensaje) {
        Alert alerta = new Alert(tipo);
        alerta.setTitle(titulo);
        alerta.setHeaderText(null);
        alerta.setContentText(mensaje);
        alerta.showAndWait();
    }
}

