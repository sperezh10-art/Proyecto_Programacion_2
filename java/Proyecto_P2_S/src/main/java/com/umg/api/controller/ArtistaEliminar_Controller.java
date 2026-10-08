
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.umg.api.controller;

import com.umg.api.model.Artista;
import com.umg.api.service.Artista_Service;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.stage.Stage;

public class ArtistaEliminar_Controller {

    @FXML
    private Button btncancelar;

    @FXML
    private Button btneliminar;

    @FXML
    private Label lblNombreArtista;

    private Artista_Service artistaService;

    private Artista artista;

    @FXML
    public void initialize() {

        artistaService = new Artista_Service();
    }

    public void setArtista(Artista artista) {

        this.artista = artista;

        if (artista != null) {

            lblNombreArtista.setText(
                    artista.getNombre()
            );
        }
    }

    @FXML
    private void eliminarArtista() {

        try {

            if (artista == null) {
                return;
            }

            artistaService.eliminarArtista(
                    artista.getId()
            );

            System.out.println(
                    "Artista eliminado correctamente."
            );

            cerrarVentana();

        } catch (Exception e) {

            e.printStackTrace();
        }
    }

    @FXML
    private void cancelar() {

        cerrarVentana();
    }

    private void cerrarVentana() {

        Stage stage = (Stage) btneliminar
                .getScene()
                .getWindow();

        stage.close();
    }
}