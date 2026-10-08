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

public class Artista_Controller {

    @FXML
    private Button btncancelar;

    @FXML
    private Button btnguardar;

    @FXML
    private TextField txtagencia;

    @FXML
    private TextField txtgenero;

    @FXML
    private TextField txtnombre;

    private Artista_Service artistaService;

    @FXML
    public void initialize() {
        artistaService = new Artista_Service();
    }

    @FXML
    private void guardarArtista() {
        try {
            String nombre = txtnombre.getText().trim();
            String genero = txtgenero.getText().trim();
            String agencia = txtagencia.getText().trim();

            if (nombre.isEmpty() || genero.isEmpty() || agencia.isEmpty()) {
                System.out.println("Debe llenar todos los campos.");
                return;
            }

            Artista artista = new Artista();

            artista.setNombre(nombre);
            artista.setGenero(genero);
            artista.setAgencia(agencia);

            artistaService.crearArtista(artista);

            System.out.println("Artista creado correctamente.");

            limpiarCampos();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @FXML
private void cancelar() {
    Stage stage = (Stage) btncancelar
            .getScene()
            .getWindow();

    stage.close();
}

    private void limpiarCampos() {
        txtnombre.clear();
        txtgenero.clear();
        txtagencia.clear();
    }
}
