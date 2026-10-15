
package com.umg.api.controller;

import com.umg.api.model.Artista;
import com.umg.api.service.Artista_Service;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class Artistas_Controller {

    // =====================================================
    // ELEMENTOS DEL FXML
    // =====================================================

    @FXML
    private TextField txtBuscar;

    @FXML
    private VBox contenedorFilas;

    @FXML
    private GridPane gridEncabezado;

    @FXML
    private Label lblSeccion;

    @FXML
    private Label lblTitulo;

    @FXML
    private Button btnCrear_Artista;

    @FXML
    private Button btnArtistas;

    @FXML
    private Button btnConciertos;

    @FXML
    private Button btnLocalidades;

    @FXML
    private Button btnUsuarios;

    // =====================================================
    // ATRIBUTOS
    // =====================================================

    private Artista_Service artistaService;

    private List<Artista> artistas = new ArrayList<>();

    private Artista artistaSeleccionado;

    private String vistaActual = "ARTISTAS";

    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    @FXML
    public void initialize() {

        artistaService = new Artista_Service();

        // Búsqueda de artistas
        txtBuscar.textProperty().addListener(
                (observable, anterior, nuevo) -> {

                    if ("ARTISTAS".equals(vistaActual)) {
                        filtrarArtistas(nuevo);
                    }
                }
        );

        // Crear artista
        btnCrear_Artista.setOnAction(
                event -> {

                    if ("ARTISTAS".equals(vistaActual)) {
                        abrirCrearArtista();
                    }
                }
        );

        // Navegación entre secciones
        btnArtistas.setOnAction(
                event -> cambiarVista("ARTISTAS")
        );

        btnConciertos.setOnAction(
                event -> cambiarVista("CONCIERTOS")
        );

        btnLocalidades.setOnAction(
                event -> cambiarVista("LOCALIDADES")
        );

        btnUsuarios.setOnAction(
                event -> cambiarVista("USUARIOS")
        );

        // Vista inicial
        cambiarVista("ARTISTAS");
    }

    // =====================================================
    // CAMBIAR DE VISTA
    // =====================================================

    private void cambiarVista(String vista) {

        vistaActual = vista;

        // Limpiar contenido anterior
        contenedorFilas.getChildren().clear();
        gridEncabezado.getChildren().clear();
        gridEncabezado.getColumnConstraints().clear();

        // Limpiar búsqueda anterior
        txtBuscar.clear();

        // Actualizar botón activo del menú
        actualizarMenuActivo();

        switch (vista) {

            case "ARTISTAS":

                lblSeccion.setText("CATÁLOGO · ARTISTAS");
                lblTitulo.setText("ARTISTAS");

                txtBuscar.setPromptText(
                        "Buscar artista, género o agencia"
                );

                configurarEncabezado(
                        "ID",
                        "NOMBRE ARTÍSTICO",
                        "GÉNERO MUSICAL",
                        "AGENCIA",
                        "ACCIONES"
                );

                btnCrear_Artista.setText("Nuevo artista");
                btnCrear_Artista.setVisible(true);
                btnCrear_Artista.setManaged(true);

                cargarArtistas();

                break;

            case "CONCIERTOS":

                lblSeccion.setText("CATÁLOGO · CONCIERTOS");
                lblTitulo.setText("CONCIERTOS");

                txtBuscar.setPromptText(
                        "Buscar concierto"
                );

                configurarEncabezado(
                        "ID",
                        "CONCIERTO",
                        "FECHA",
                        "ESTADIO",
                        "ACCIONES"
                );

                ocultarCrearArtista();

                mostrarMensajePendiente(
                        "La tabla de conciertos está preparada. "
                        + "Falta conectar el modelo y el servicio "
                        + "de conciertos para cargar los datos reales."
                );

                break;

            case "LOCALIDADES":

                lblSeccion.setText("CATÁLOGO · LOCALIDADES");
                lblTitulo.setText("LOCALIDADES");

                txtBuscar.setPromptText(
                        "Buscar localidad"
                );

                configurarEncabezado(
                        "ID",
                        "LOCALIDAD",
                        "ESTADIO",
                        "PRECIO",
                        "ACCIONES"
                );

                ocultarCrearArtista();

                mostrarMensajePendiente(
                        "La tabla de localidades está preparada. "
                        + "Falta conectar el modelo y el servicio "
                        + "de localidades para cargar los datos reales."
                );

                break;

            case "USUARIOS":

                lblSeccion.setText("ADMINISTRACIÓN · USUARIOS");
                lblTitulo.setText("USUARIOS");

                txtBuscar.setPromptText(
                        "Buscar usuario"
                );

                configurarEncabezado(
                        "USUARIO",
                        "ROL",
                        "PUNTO DE VENTA",
                        "CREADO",
                        "ÚLTIMO ACCESO",
                        "ESTADO",
                        "ACCIONES"
                );

                ocultarCrearArtista();

                mostrarMensajePendiente(
                        "La tabla de usuarios está preparada. "
                        + "Falta conectar los usuarios con su API "
                        + "y agregar los controles para activar "
                        + "o desactivar cada cuenta."
                );

                break;

            default:

                cambiarVista("ARTISTAS");

                break;
        }
    }

    // =====================================================
    // ACTUALIZAR MENÚ LATERAL
    // =====================================================

    private void actualizarMenuActivo() {

        Button[] botones = {
            btnArtistas,
            btnConciertos,
            btnLocalidades,
            btnUsuarios
        };

        for (Button boton : botones) {

            boton.getStyleClass().remove("nav-active");
        }

        switch (vistaActual) {

            case "ARTISTAS":
                btnArtistas.getStyleClass().add("nav-active");
                break;

            case "CONCIERTOS":
                btnConciertos.getStyleClass().add("nav-active");
                break;

            case "LOCALIDADES":
                btnLocalidades.getStyleClass().add("nav-active");
                break;

            case "USUARIOS":
                btnUsuarios.getStyleClass().add("nav-active");
                break;
        }
    }

    // =====================================================
    // CONFIGURAR ENCABEZADOS DINÁMICOS
    // =====================================================

    private void configurarEncabezado(String... columnas) {

        gridEncabezado.getChildren().clear();
        gridEncabezado.getColumnConstraints().clear();

        double[] porcentajes;

        if ("USUARIOS".equals(vistaActual)) {

            porcentajes = new double[]{
                18, 12, 16, 13, 16, 10, 15
            };

        } else {

            porcentajes = new double[]{
                8, 30, 22, 22, 18
            };
        }

        for (int i = 0; i < columnas.length; i++) {

            ColumnConstraints columna =
                    new ColumnConstraints();

            columna.setPercentWidth(porcentajes[i]);
            columna.setMinWidth(10);
            columna.setHgrow(Priority.ALWAYS);

            gridEncabezado.getColumnConstraints().add(
                    columna
            );

            Label encabezado =
                    new Label(columnas[i]);

            encabezado.getStyleClass().add("th");

            encabezado.setMaxWidth(Double.MAX_VALUE);

            gridEncabezado.add(
                    encabezado,
                    i,
                    0
            );
        }
    }

    // =====================================================
    // BOTÓN CREAR ARTISTA
    // =====================================================

    private void ocultarCrearArtista() {

        btnCrear_Artista.setVisible(false);
        btnCrear_Artista.setManaged(false);
    }

    // =====================================================
    // MENSAJE PROVISIONAL PARA SECCIONES NO CONECTADAS
    // =====================================================

    private void mostrarMensajePendiente(String mensaje) {

        Label etiqueta = new Label(mensaje);

        etiqueta.setWrapText(true);
        etiqueta.setPadding(new Insets(24));
        etiqueta.setMaxWidth(Double.MAX_VALUE);

        etiqueta.getStyleClass().add("s13");

        contenedorFilas.getChildren().add(etiqueta);
    }

    // =====================================================
    // CARGAR ARTISTAS DESDE LA API
    // =====================================================

    private void cargarArtistas() {

        try {

            List<Artista> resultado =
                    artistaService.obtenerArtistas();

            artistas = resultado != null
                    ? new ArrayList<>(resultado)
                    : new ArrayList<>();

            filtrarArtistas(txtBuscar.getText());

        } catch (Exception e) {

            System.out.println(
                    "ERROR AL CARGAR ARTISTAS:"
            );

            e.printStackTrace();

            artistas = new ArrayList<>();

            contenedorFilas.getChildren().clear();

            mostrarMensajePendiente(
                    "No fue posible cargar los artistas. "
                    + "Comprueba la conexión con la API."
            );
        }
    }

    // =====================================================
    // FILTRAR ARTISTAS
    // =====================================================

    private void filtrarArtistas(String texto) {

        if (!"ARTISTAS".equals(vistaActual)) {
            return;
        }

        if (artistas == null) {
            artistas = new ArrayList<>();
        }

        if (texto == null || texto.isBlank()) {

            mostrarArtistas(artistas);

            return;
        }

        String busqueda =
                texto.toLowerCase(Locale.ROOT).trim();

        List<Artista> filtrados = artistas.stream()
                .filter(artista -> {

                    if (artista == null) {
                        return false;
                    }

                    String nombre = artista.getNombre();
                    String genero = artista.getGenero();
                    String agencia = artista.getAgencia();

                    return contiene(nombre, busqueda)
                            || contiene(genero, busqueda)
                            || contiene(agencia, busqueda);
                })
                .toList();

        mostrarArtistas(filtrados);
    }

    private boolean contiene(
            String valor,
            String busqueda) {

        return valor != null
                && valor.toLowerCase(Locale.ROOT)
                        .contains(busqueda);
    }

    // =====================================================
    // MOSTRAR ARTISTAS
    // =====================================================

    private void mostrarArtistas(List<Artista> lista) {

        contenedorFilas.getChildren().clear();

        if (lista == null || lista.isEmpty()) {

            Label mensaje = new Label(
                    "No se encontraron artistas."
            );

            mensaje.setPadding(new Insets(24));
            mensaje.getStyleClass().add("s13");

            contenedorFilas.getChildren().add(mensaje);

            return;
        }

        for (Artista artista : lista) {

            if (artista == null) {
                continue;
            }

            GridPane fila = crearFila(artista);

            contenedorFilas.getChildren().add(fila);
        }
    }

    // =====================================================
    // CREAR FILA DE ARTISTA
    // =====================================================

    private GridPane crearFila(Artista artista) {

        GridPane fila = new GridPane();

        fila.getStyleClass().add("trow");

        fila.setPrefHeight(70);
        fila.setMinHeight(70);
        fila.setMaxWidth(Double.MAX_VALUE);
        fila.setPadding(
                new Insets(10, 18, 10, 18)
        );

        fila.setHgap(10);

        double[] porcentajes = {
            8, 30, 22, 22, 18
        };

        for (double porcentaje : porcentajes) {

            ColumnConstraints columna =
                    new ColumnConstraints();

            columna.setPercentWidth(porcentaje);
            columna.setMinWidth(10);
            columna.setHgrow(Priority.ALWAYS);

            fila.getColumnConstraints().add(columna);
        }

        // ID

        Label lbId = new Label(
                "#" + String.format(
                        "%02d",
                        artista.getId()
                )
        );

        lbId.getStyleClass().addAll(
                "s12",
                "c-dim"
        );

        fila.add(lbId, 0, 0);

        // NOMBRE E INICIAL

        HBox nombreBox = new HBox(10);

        nombreBox.setAlignment(Pos.CENTER_LEFT);

        StackPane avatar = new StackPane();

        avatar.setPrefSize(36, 36);
        avatar.setMinSize(36, 36);
        avatar.setMaxSize(36, 36);

        avatar.getStyleClass().add("avatar");

        String nombre = artista.getNombre();

        String inicial = "?";

        if (nombre != null && !nombre.isBlank()) {

            inicial = nombre.substring(0, 1)
                    .toUpperCase(Locale.ROOT);
        }

        Label inicialLabel = new Label(inicial);

        inicialLabel.getStyleClass().add("avatar-text");

        avatar.getChildren().add(inicialLabel);

        Label lbNombre = new Label(
                nombre != null ? nombre : ""
        );

        lbNombre.getStyleClass().addAll(
                "s13",
                "w600"
        );

        nombreBox.getChildren().addAll(
                avatar,
                lbNombre
        );

        fila.add(nombreBox, 1, 0);

        // GÉNERO

        Label lbGenero = new Label(
                artista.getGenero() != null
                        ? artista.getGenero()
                        : ""
        );

        lbGenero.getStyleClass().addAll(
                "s13",
                "c-text2"
        );

        fila.add(lbGenero, 2, 0);

        // AGENCIA

        Label lbAgencia = new Label(
                artista.getAgencia() != null
                        ? artista.getAgencia()
                        : ""
        );

        lbAgencia.getStyleClass().addAll(
                "s13",
                "c-text2"
        );

        fila.add(lbAgencia, 3, 0);

        // ACCIONES

        HBox acciones = new HBox(5);

        acciones.setAlignment(Pos.CENTER_RIGHT);

        Button btnEditar = new Button();

        btnEditar.setMnemonicParsing(false);
        btnEditar.setTooltip(
                new javafx.scene.control.Tooltip("Editar artista")
        );

        btnEditar.getStyleClass().add("btn-icon");

        Region iconEditar = new Region();

        iconEditar.getStyleClass().addAll(
                "icon",
                "ic-edit",
                "ic-muted"
        );

        btnEditar.setGraphic(iconEditar);

        btnEditar.setOnAction(event -> {

            artistaSeleccionado = artista;

            abrirEditarArtista(artistaSeleccionado);
        });

        Button btnEliminar = new Button();

        btnEliminar.setMnemonicParsing(false);
        btnEliminar.setTooltip(
                new javafx.scene.control.Tooltip("Eliminar artista")
        );

        btnEliminar.getStyleClass().addAll(
                "btn-icon",
                "btn-danger"
        );

        Region iconEliminar = new Region();

        iconEliminar.getStyleClass().addAll(
                "icon",
                "ic-delete",
                "ic-muted"
        );

        btnEliminar.setGraphic(iconEliminar);

        btnEliminar.setOnAction(event -> {

            artistaSeleccionado = artista;

            abrirEliminarArtista(artistaSeleccionado);
        });

        acciones.getChildren().addAll(
                btnEditar,
                btnEliminar
        );

        fila.add(acciones, 4, 0);

        // SELECCIÓN DE FILA

        fila.setOnMouseClicked(event -> {

            if (event.getTarget() instanceof Button
                    || event.getTarget() instanceof Region) {
                return;
            }

            artistaSeleccionado = artista;

            for (var nodo : contenedorFilas.getChildren()) {
                nodo.getStyleClass().remove("selected");
            }

            fila.getStyleClass().add("selected");

            System.out.println(
                    "Artista seleccionado: "
                    + artistaSeleccionado.getNombre()
                    + " | ID: "
                    + artistaSeleccionado.getId()
            );
        });

        return fila;
    }

    // =====================================================
    // CREAR ARTISTA
    // =====================================================

    private void abrirCrearArtista() {

        try {

            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource(
                            "/Recursos/ArtistaForm.fxml"
                    )
            );

            Parent root = loader.load();

            Stage stage = new Stage();

            stage.initModality(
                    Modality.APPLICATION_MODAL
            );

            stage.setTitle("Nuevo artista");

            stage.setScene(new Scene(root));

            stage.showAndWait();

            cargarArtistas();

        } catch (Exception e) {

            System.out.println(
                    "ERROR AL ABRIR CREAR ARTISTA:"
            );

            e.printStackTrace();
        }
    }

    // =====================================================
    // EDITAR ARTISTA
    // =====================================================

    private void abrirEditarArtista(Artista artista) {

        try {

            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource(
                            "/Recursos/Editar_Artista.fxml"
                    )
            );

            Parent root = loader.load();

            ArtistaEditar_Controller controller =
                    loader.getController();

            controller.setArtista(artista);

            Stage stage = new Stage();

            stage.initModality(
                    Modality.APPLICATION_MODAL
            );

            stage.setTitle("Editar artista");

            stage.setScene(new Scene(root));

            stage.showAndWait();

            cargarArtistas();

        } catch (Exception e) {

            System.out.println(
                    "ERROR AL ABRIR EDITAR ARTISTA:"
            );

            e.printStackTrace();
        }
    }

    // =====================================================
    // ELIMINAR ARTISTA
    // =====================================================

    private void abrirEliminarArtista(Artista artista) {

        try {

            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource(
                            "/Recursos/Eliminar_Artista.fxml"
                    )
            );

            Parent root = loader.load();

            ArtistaEliminar_Controller controller =
                    loader.getController();

            controller.setArtista(artista);

            Stage stage = new Stage();

            stage.initModality(
                    Modality.APPLICATION_MODAL
            );

            stage.setTitle("Eliminar artista");

            stage.setScene(new Scene(root));

            stage.showAndWait();

            cargarArtistas();

        } catch (Exception e) {

            System.out.println(
                    "ERROR AL ABRIR ELIMINAR ARTISTA:"
            );

            e.printStackTrace();
        }
    }
}
