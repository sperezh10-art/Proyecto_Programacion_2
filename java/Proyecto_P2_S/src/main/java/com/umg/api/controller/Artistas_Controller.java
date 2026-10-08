/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
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
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.List;

public class Artistas_Controller {

    @FXML
    private TextField txtBuscar;

    @FXML
    private VBox tbartistas;

    @FXML
    private Button btnCrear_Artista;

    private Artista_Service artistaService;

   private List<Artista> artistas;

    private Artista artistaSeleccionado;

    @FXML
    public void initialize() {

        artistaService = new Artista_Service();

        cargarArtistas();

        txtBuscar.textProperty().addListener(
                (observable, anterior, nuevo) -> {
                    filtrarArtistas(nuevo);
                }
        );

        btnCrear_Artista.setOnAction(
                event -> abrirCrearArtista()
        );
    }

    private void cargarArtistas() {

        try {

            artistas = artistaService.obtenerArtistas();

            mostrarArtistas(artistas);

        } catch (Exception e) {

            System.out.println(
                    "ERROR AL CARGAR ARTISTAS:"
            );

            e.printStackTrace();
        }
    }

    private void filtrarArtistas(String texto) {

        if (texto == null || texto.trim().isEmpty()) {

            mostrarArtistas(artistas);

            return;
        }

        String busqueda =
                texto.toLowerCase().trim();

        List<Artista> filtrados =
                artistas.stream()
                        .filter(artista ->
                                (artista.getNombre() != null &&
                                 artista.getNombre()
                                        .toLowerCase()
                                        .contains(busqueda))
                                ||
                                (artista.getGenero() != null &&
                                 artista.getGenero()
                                        .toLowerCase()
                                        .contains(busqueda))
                                ||
                                (artista.getAgencia() != null &&
                                 artista.getAgencia()
                                        .toLowerCase()
                                        .contains(busqueda))
                        )
                        .toList();

        mostrarArtistas(filtrados);
    }

    private void mostrarArtistas(
            List<Artista> lista) {

        tbartistas.getChildren().clear();

        for (Artista artista : lista) {

            GridPane fila =
                    crearFila(artista);

            tbartistas.getChildren().add(fila);
        }
    }

    private GridPane crearFila(
            Artista artista) {

        GridPane fila =
                new GridPane();

        fila.getStyleClass().add("trow");

        fila.setPrefHeight(70);
        fila.setMinHeight(70);

        fila.setPadding(
                new Insets(
                        10,
                        18,
                        10,
                        18
                )
        );

        fila.setHgap(10);

        // COLUMNAS

        fila.getColumnConstraints().add(
                new ColumnConstraints(50)
        );

        ColumnConstraints colNombre =
                new ColumnConstraints();

        colNombre.setHgrow(
                javafx.scene.layout.Priority.ALWAYS
        );

        fila.getColumnConstraints()
                .add(colNombre);

        ColumnConstraints colGenero =
                new ColumnConstraints();

        colGenero.setHgrow(
                javafx.scene.layout.Priority.ALWAYS
        );

        fila.getColumnConstraints()
                .add(colGenero);

        ColumnConstraints colAgencia =
                new ColumnConstraints();

        colAgencia.setHgrow(
                javafx.scene.layout.Priority.ALWAYS
        );

        fila.getColumnConstraints()
                .add(colAgencia);

        fila.getColumnConstraints().add(
                new ColumnConstraints(90)
        );

        // ID

        Label lbId =
                new Label(
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

        // NOMBRE

        HBox nombreBox =
                new HBox(10);

        nombreBox.setAlignment(
                Pos.CENTER_LEFT
        );

        StackPane avatar =
                new StackPane();

        avatar.setPrefSize(36, 36);
        avatar.setMinSize(36, 36);
        avatar.setMaxSize(36, 36);

        avatar.getStyleClass()
                .add("avatar");

        String nombre =
                artista.getNombre();

        String inicial = "?";

        if (nombre != null &&
            !nombre.isBlank()) {

            inicial =
                    nombre.substring(0, 1)
                          .toUpperCase();
        }

        Label inicialLabel =
                new Label(inicial);

        inicialLabel.getStyleClass()
                .add("avatar-text");

        avatar.getChildren()
                .add(inicialLabel);

        Label lbNombre =
                new Label(
                        nombre != null
                                ? nombre
                                : ""
                );

        lbNombre.getStyleClass().addAll(
                "s13",
                "w600"
        );

        nombreBox.getChildren()
                .addAll(
                        avatar,
                        lbNombre
                );

        fila.add(
                nombreBox,
                1,
                0
        );

        // GENERO

        Label lbGenero =
                new Label(
                        artista.getGenero() != null
                                ? artista.getGenero()
                                : ""
                );

        lbGenero.getStyleClass()
                .addAll(
                        "s13",
                        "c-text2"
                );

        fila.add(
                lbGenero,
                2,
                0
        );

        // AGENCIA

        Label lbAgencia =
                new Label(
                        artista.getAgencia() != null
                                ? artista.getAgencia()
                                : ""
                );

        lbAgencia.getStyleClass()
                .addAll(
                        "s13",
                        "c-text2"
                );

        fila.add(
                lbAgencia,
                3,
                0
        );

        // BOTONES

        HBox acciones =
                new HBox(5);

        acciones.setAlignment(
                Pos.CENTER_RIGHT
        );

        Button btnEditar =
                new Button();

        btnEditar.setMnemonicParsing(false);

        btnEditar.getStyleClass()
                .add("btn-icon");

        Region iconEditar =
                new Region();

        iconEditar.getStyleClass()
                .addAll(
                        "icon",
                        "ic-edit",
                        "ic-muted"
                );

        btnEditar.setGraphic(
                iconEditar
        );

        // EVENTO EDITAR

        btnEditar.setOnAction(event -> {

    artistaSeleccionado = artista;

    abrirEditarArtista(artistaSeleccionado);
});

        Button btnEliminar =
                new Button();

        btnEliminar.setMnemonicParsing(false);

        btnEliminar.getStyleClass()
                .addAll(
                        "btn-icon",
                        "btn-danger"
                );

        Region iconEliminar =
                new Region();

        iconEliminar.getStyleClass()
                .addAll(
                        "icon",
                        "ic-delete",
                        "ic-muted"
                );

        btnEliminar.setGraphic(
                iconEliminar
        );

        // EVENTO ELIMINAR

       btnEliminar.setOnAction(event -> {

    artistaSeleccionado = artista;

    abrirEliminarArtista(artistaSeleccionado);
});

        acciones.getChildren()
                .addAll(
                        btnEditar,
                        btnEliminar
                );

        fila.add(
                acciones,
                4,
                0
        );
        
        fila.setOnMouseClicked(event -> {

    // Guardar artista seleccionado
    artistaSeleccionado = artista;

    // Quitar selección de todas las filas
    for (var nodo : tbartistas.getChildren()) {
        nodo.getStyleClass().remove("selected");
    }

    // Seleccionar esta fila
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

            FXMLLoader loader =
                    new FXMLLoader(
                            getClass().getResource(
                                    "/Recursos/ArtistaForm.fxml"
                            )
                    );

            Parent root =
                    loader.load();

            Stage stage =
                    new Stage();

            stage.initModality(
                    Modality.APPLICATION_MODAL
            );

            stage.setTitle(
                    "Nuevo artista"
            );

            stage.setScene(
                    new Scene(root)
            );

            stage.showAndWait();

            cargarArtistas();

        } catch (Exception e) {

            e.printStackTrace();
        }
    }

    // =====================================================
    // EDITAR ARTISTA
    // =====================================================

    private void abrirEditarArtista(Artista artista) {

    try {

        System.out.println("Intentando abrir ArtistaEditar.fxml...");

        FXMLLoader loader =
                new FXMLLoader(
                        getClass().getResource(
                                "/Recursos/Editar_Artista.fxml"
                        )
                );

        System.out.println("FXML encontrado: " + loader.getLocation());

        Parent root = loader.load();

        System.out.println("FXML cargado correctamente.");

        ArtistaEditar_Controller controller =
                loader.getController();

        System.out.println(
                "Controller: " + controller
        );

        controller.setArtista(artista);

        Stage stage = new Stage();

        stage.initModality(
                Modality.APPLICATION_MODAL
        );

        stage.setTitle("Editar artista");

        stage.setScene(
                new Scene(root)
        );

        stage.showAndWait();

        cargarArtistas();

    } catch (Exception e) {

        System.out.println(
                "ERROR AL ABRIR EDITAR:"
        );

        e.printStackTrace();
    }
}

    // =====================================================
    // ELIMINAR ARTISTA
    // =====================================================

    private void abrirEliminarArtista(Artista artista) {

    try {

        System.out.println("Intentando abrir ArtistaEliminar.fxml...");

        FXMLLoader loader =
                new FXMLLoader(
                        getClass().getResource(
                                "/Recursos/Eliminar_Artista.fxml"
                        )
                );

        System.out.println("FXML encontrado: " + loader.getLocation());

        Parent root = loader.load();

        System.out.println("FXML cargado correctamente.");

        ArtistaEliminar_Controller controller =
                loader.getController();

        System.out.println(
                "Controller: " + controller
        );

        controller.setArtista(artista);

        Stage stage = new Stage();

        stage.initModality(
                Modality.APPLICATION_MODAL
        );

        stage.setTitle("Eliminar artista");

        stage.setScene(
                new Scene(root)
        );

        stage.showAndWait();

        cargarArtistas();

    } catch (Exception e) {

        System.out.println(
                "ERROR AL ABRIR ELIMINAR:"
        );

        e.printStackTrace();
    }
}
}