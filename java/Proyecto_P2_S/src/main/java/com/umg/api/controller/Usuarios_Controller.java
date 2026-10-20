/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.umg.api.controller;

import com.umg.api.model.Usuario;
import com.umg.api.service.Usuario_Service;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.ToggleButton;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.geometry.Insets;
import javafx.geometry.HPos;
import javafx.geometry.Pos;
import javafx.stage.Modality;
import javafx.stage.Stage;

public class Usuarios_Controller {

    @FXML
    private Label lblResumen;

    @FXML
    private Button btnNuevoUsuario;

    @FXML
    private ScrollPane scrollUsuarios;

    @FXML
    private VBox contenedorUsuarios;

    private final Usuario_Service servicio = new Usuario_Service();

    @FXML
    public void initialize() {
        cargarUsuarios();
    }

    // ==========================================
    // CARGAR USUARIOS DESDE LA API
    // ==========================================

    private void cargarUsuarios() {
        try {
            List<Usuario> usuarios = servicio.obtenerUsuarios();

            contenedorUsuarios.getChildren().clear();

            long activos = usuarios.stream()
                    .filter(Usuario::isStatus)
                    .count();

            lblResumen.setText(
                    "ACCESO · " + usuarios.size()
                    + " USUARIOS · " + activos + " ACTIVOS"
            );

            if (usuarios.isEmpty()) {
                Label vacio = new Label("No hay usuarios registrados.");
                vacio.getStyleClass().add("s13");
                vacio.setPadding(new Insets(24));
                contenedorUsuarios.getChildren().add(vacio);
                return;
            }

            for (Usuario usuario : usuarios) {
                contenedorUsuarios.getChildren().add(
                        crearFila(usuario)
                );
            }

        } catch (IOException ex) {
            mostrarError(
                    "No se pudieron cargar los usuarios.\n"
                    + ex.getMessage()
            );
        }
    }

    // ==========================================
    // CREAR FILA VISUAL
    // ==========================================

    private GridPane crearFila(Usuario usuario) {

        GridPane fila = new GridPane();
        fila.setHgap(12);
        fila.getStyleClass().add("trow");
        fila.setPadding(new Insets(10, 18, 10, 18));

        agregarColumnas(fila);

        // Usuario y nombre completo
        HBox datos = new HBox(10);
        datos.setAlignment(Pos.CENTER_LEFT);

        StackPane avatar = new StackPane();
        avatar.getStyleClass().add("avatar");
        avatar.setMinSize(34, 34);
        avatar.setPrefSize(34, 34);
        avatar.setMaxSize(34, 34);

        Label iniciales = new Label(obtenerIniciales(usuario));
        iniciales.getStyleClass().addAll("s12", "w700", "c-amber");
        avatar.getChildren().add(iniciales);

        VBox nombres = new VBox(3);

        Label nombre = new Label(
                usuario.getNombre() == null
                || usuario.getNombre().isBlank()
                ? usuario.getUsuario()
                : usuario.getNombre()
        );
        nombre.getStyleClass().addAll("s13", "w600");

        Label cuenta = new Label(usuario.getUsuario());
        cuenta.getStyleClass().addAll("s12", "c-dim");

        nombres.getChildren().addAll(nombre, cuenta);
        datos.getChildren().addAll(avatar, nombres);

        fila.add(datos, 0, 0);

        // Rol
        HBox rol = new HBox();
        rol.setAlignment(Pos.CENTER_LEFT);

        HBox etiquetaRol = new HBox();
        etiquetaRol.setAlignment(Pos.CENTER_LEFT);
        etiquetaRol.getStyleClass().add("pill");

        Label textoRol = new Label(
                usuario.getRol() == null
                || usuario.getRol().isBlank()
                ? "Sin rol"
                : usuario.getRol()
        );
        textoRol.getStyleClass().add("s11");

        if ("Administrador".equalsIgnoreCase(usuario.getRol())) {
            etiquetaRol.setStyle(
                    "-fx-background-color: rgba(255,176,32,0.13);"
            );
            textoRol.setStyle("-fx-text-fill: #FFB020;");
        } else {
            etiquetaRol.setStyle(
                    "-fx-background-color: rgba(60,200,224,0.13);"
            );
            textoRol.setStyle("-fx-text-fill: #3CC8E0;");
        }

        etiquetaRol.getChildren().add(textoRol);
        rol.getChildren().add(etiquetaRol);
        fila.add(rol, 1, 0);

        // Datos que todavía no existen en el modelo de la API
        fila.add(crearEtiqueta("—", "s13", "c-text2"), 2, 0);
        fila.add(crearEtiqueta(formatearFecha(usuario), "s12", "c-muted"), 3, 0);
        fila.add(crearEtiqueta("—", "s12", "c-muted"), 4, 0);

        // Estado
        HBox estado = new HBox(6);
        estado.setAlignment(Pos.CENTER_LEFT);

        Region punto = new Region();
        punto.getStyleClass().add("dot");
        punto.setMinSize(7, 7);
        punto.setPrefSize(7, 7);
        punto.setMaxSize(7, 7);

        Label textoEstado = new Label();
        actualizarVisualEstado(
                usuario.isStatus(), punto, textoEstado
        );

        estado.getChildren().addAll(punto, textoEstado);
        fila.add(estado, 5, 0);

        // Botones de acciones
        HBox acciones = new HBox(4);
        acciones.setAlignment(Pos.CENTER_RIGHT);

        ToggleButton interruptor = new ToggleButton();
        interruptor.getStyleClass().add("switch");
        interruptor.setSelected(usuario.isStatus());

        interruptor.setOnAction(event -> {
            boolean nuevoEstado = interruptor.isSelected();

            interruptor.setDisable(true);

            try {
                servicio.cambiarEstado(usuario.getId(), nuevoEstado);
                cargarUsuarios();
            } catch (IOException ex) {
                interruptor.setSelected(!nuevoEstado);
                mostrarError(
                        "No se pudo cambiar el estado del usuario.\n"
                        + ex.getMessage()
                );
            } finally {
                interruptor.setDisable(false);
            }
        });

        Button editar = new Button();
        editar.getStyleClass().add("btn-icon");

        Region iconoEditar = new Region();
        iconoEditar.getStyleClass().addAll(
                "icon", "ic-edit", "ic-muted"
        );
        iconoEditar.setMinSize(18, 18);
        iconoEditar.setPrefSize(18, 18);
        iconoEditar.setMaxSize(18, 18);
        editar.setGraphic(iconoEditar);
        editar.setMnemonicParsing(false);

        // La edición se conectará cuando implementemos el formulario de edición.
        editar.setOnAction(event -> mostrarInformacion(
                "Edición de usuario",
                "La edición de usuarios se implementará en el siguiente paso."
        ));

        acciones.getChildren().addAll(interruptor, editar);
        fila.add(acciones, 6, 0);

        return fila;
    }

    private void agregarColumnas(GridPane fila) {
        ColumnConstraints c0 = new ColumnConstraints();
        c0.setHgrow(javafx.scene.layout.Priority.ALWAYS);
        c0.setMinWidth(10);
        c0.setPrefWidth(240);

        ColumnConstraints c1 = columnaFija(130);
        ColumnConstraints c2 = columnaFija(140);
        ColumnConstraints c3 = columnaFija(110);
        ColumnConstraints c4 = columnaFija(110);
        ColumnConstraints c5 = columnaFija(100);

        ColumnConstraints c6 = columnaFija(80);
        c6.setHalignment(HPos.RIGHT);

        fila.getColumnConstraints().addAll(
                c0, c1, c2, c3, c4, c5, c6
        );
    }

    private ColumnConstraints columnaFija(double ancho) {
        ColumnConstraints columna = new ColumnConstraints();
        columna.setMinWidth(ancho);
        columna.setPrefWidth(ancho);
        columna.setMaxWidth(ancho);
        return columna;
    }

    private Label crearEtiqueta(
            String texto,
            String... clases
    ) {
        Label etiqueta = new Label(texto);
        etiqueta.getStyleClass().addAll(clases);
        return etiqueta;
    }

    private String obtenerIniciales(Usuario usuario) {
        String nombre = usuario.getNombre();

        if (nombre == null || nombre.isBlank()) {
            nombre = usuario.getUsuario();
        }

        if (nombre == null || nombre.isBlank()) {
            return "US";
        }

        String[] partes = nombre.trim().split("\\s+");

        if (partes.length == 1) {
            return partes[0].substring(
                    0, Math.min(2, partes[0].length())
            ).toUpperCase(Locale.ROOT);
        }

        return (
                partes[0].substring(0, 1)
                + partes[partes.length - 1].substring(0, 1)
        ).toUpperCase(Locale.ROOT);
    }

    private String formatearFecha(Usuario usuario) {
        if (usuario.getCreatedAt() == null) {
            return "—";
        }

        return usuario.getCreatedAt().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );
    }

    private void actualizarVisualEstado(
            boolean activo,
            Region punto,
            Label texto
    ) {
        if (activo) {
            punto.setStyle("-fx-background-color: #5BD68A;");
            texto.setText("Activo");
            texto.getStyleClass().setAll("s13", "w600", "c-green");
        } else {
            punto.setStyle("-fx-background-color: #8C8679;");
            texto.setText("Inactivo");
            texto.getStyleClass().setAll("s13", "w600", "c-dim");
        }
    }

    // ==========================================
    // ABRIR FORMULARIO DE CREACIÓN
    // ==========================================

    @FXML
    private void abrirFormulario() {
        try {
            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource("/Recursos/UsuarioForm.fxml")
            );

            Parent formulario = loader.load();

            Usuario_Controller controlador = loader.getController();
            controlador.setAlGuardar(this::cargarUsuarios);

            Stage ventana = new Stage();
            ventana.initModality(Modality.APPLICATION_MODAL);
            ventana.setTitle("Nuevo usuario");
            ventana.setScene(new Scene(formulario));
            ventana.setResizable(false);
            ventana.showAndWait();

        } catch (IOException ex) {
            mostrarError(
                    "No se pudo abrir el formulario.\n"
                    + ex.getMessage()
            );
        }
    }

    private void mostrarError(String mensaje) {
        Alert alerta = new Alert(Alert.AlertType.ERROR);
        alerta.setTitle("Error");
        alerta.setHeaderText("Operación no completada");
        alerta.setContentText(mensaje);
        alerta.showAndWait();
    }

    private void mostrarInformacion(
            String titulo,
            String mensaje
    ) {
        Alert alerta = new Alert(Alert.AlertType.INFORMATION);
        alerta.setTitle(titulo);
        alerta.setHeaderText(null);
        alerta.setContentText(mensaje);
        alerta.showAndWait();
    }
}
