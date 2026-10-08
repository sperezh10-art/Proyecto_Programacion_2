/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.umg.api.controller;

import com.umg.api.model.Artista;
import com.umg.api.service.Artista_Service;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

public class ArtistaEditar_Controller {

    @FXML
    private Button btncancelar;

    @FXML
    private Button btnguardar;

    @FXML
    private TextField txtnombre;

    @FXML
    private TextField txtgenero;

    @FXML
    private TextField txtagencia;

    private Artista_Service artistaService;

    private Artista artista;

    @FXML
    public void initialize() {

        artistaService = new Artista_Service();
    }

    public void setArtista(Artista artista) {

        this.artista = artista;

        txtnombre.setText(
                artista.getNombre() != null
                        ? artista.getNombre()
                        : ""
        );

        txtgenero.setText(
                artista.getGenero() != null
                        ? artista.getGenero()
                        : ""
        );

        txtagencia.setText(
                artista.getAgencia() != null
                        ? artista.getAgencia()
                        : ""
        );
    }

    @FXML
    private void guardarArtista() {

        try {

            if (artista == null) {
                return;
            }

            String nombre = txtnombre.getText().trim();
            String genero = txtgenero.getText().trim();
            String agencia = txtagencia.getText().trim();

            /*
             * Si un campo está vacío,
             * conservamos el valor anterior.
             */

            if (nombre.isEmpty()) {
                nombre = artista.getNombre();
            }

            if (genero.isEmpty()) {
                genero = artista.getGenero();
            }

            if (agencia.isEmpty()) {
                agencia = artista.getAgencia();
            }

            artista.setNombre(nombre);
            artista.setGenero(genero);
            artista.setAgencia(agencia);

            artistaService.modificarArtista(
                    artista.getId(),
                    artista
            );

            System.out.println(
                    "Artista modificado correctamente."
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

        Stage stage = (Stage) btnguardar
                .getScene()
                .getWindow();

        stage.close();
    }
}