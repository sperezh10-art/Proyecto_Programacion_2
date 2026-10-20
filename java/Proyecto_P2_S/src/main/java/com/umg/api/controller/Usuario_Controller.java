
package com.umg.api.controller;

import com.umg.api.model.Usuario;
import com.umg.api.service.Usuario_Service;

import java.io.IOException;

import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;

public class Usuario_Controller {

    @FXML
    private TextField txtUsuario;

    @FXML
    private TextField txtNombre;

    @FXML
    private ToggleButton btnVendedor;

    @FXML
    private ToggleButton btnAdministrador;

    @FXML
    private PasswordField txtContrasena;

    @FXML
    private PasswordField txtConfirmar;

    @FXML
    private HBox lblError;

    @FXML
    private Label txtError;

    @FXML
    private Button btnCancelar;

    @FXML
    private Button btnCerrar;

    @FXML
    private Button btnGuardar;

    private final Usuario_Service servicio = new Usuario_Service();

    private Runnable alGuardar;

    // Si es null, el formulario funciona en modo creación.
    // Si tiene un usuario, funciona en modo edición.
    private Usuario usuarioEditar;

    @FXML
    private void initialize() {
        ocultarError();
    }

    public void setAlGuardar(Runnable accion) {
        this.alGuardar = accion;
    }

    // Preparar el formulario para editar un usuario existente.
    public void setUsuarioEditar(Usuario usuario) {

        if (usuario == null) {
            throw new IllegalArgumentException(
                    "El usuario que se va a editar no puede ser null."
            );
        }

        this.usuarioEditar = usuario;

        txtUsuario.setText(usuario.getUsuario());
        txtNombre.setText(
                usuario.getNombre() == null ? "" : usuario.getNombre()
        );

        String rol = usuario.getRol();

        btnVendedor.setSelected(
                rol != null && rol.equalsIgnoreCase("Vendedor")
        );

        btnAdministrador.setSelected(
                rol != null && rol.equalsIgnoreCase("Administrador")
        );

        // Nunca rellenar el campo con una contraseña existente.
        txtContrasena.clear();
        txtConfirmar.clear();

        ocultarError();
    }

    @FXML
    private void cerrarFormulario() {
        cerrarVentana();
    }

    @FXML
    private void guardarUsuario() {

        String usuario = txtUsuario.getText().trim();
        String nombre = txtNombre.getText().trim();
        String contrasena = txtContrasena.getText();
        String confirmar = txtConfirmar.getText();

        if (usuario.isEmpty()) {
            mostrarError("Escribe el nombre de usuario.");
            txtUsuario.requestFocus();
            return;
        }

        String rol;

        if (btnAdministrador.isSelected()) {
            rol = "Administrador";
        } else if (btnVendedor.isSelected()) {
            rol = "Vendedor";
        } else {
            mostrarError("Selecciona un rol para el usuario.");
            return;
        }

        boolean editando = usuarioEditar != null;

        if (editando) {

            // En edición, ambos campos vacíos significan conservar
            // la contraseña actual.
            boolean cambiarContrasena =
                    !contrasena.isEmpty() || !confirmar.isEmpty();

            if (cambiarContrasena) {

                if (contrasena.isBlank() || confirmar.isBlank()) {
                    mostrarError(
                            "Escribe y confirma la nueva contraseña."
                    );
                    return;
                }

                if (!contrasena.equals(confirmar)) {
                    mostrarError("Las contraseñas no coinciden.");
                    txtConfirmar.requestFocus();
                    return;
                }

                if (contrasena.length() < 8) {
                    mostrarError(
                            "La contraseña debe tener al menos 8 caracteres."
                    );
                    txtContrasena.requestFocus();
                    return;
                }
            }

        } else {

            // En creación, la contraseña es obligatoria.
            if (contrasena.isBlank()) {
                mostrarError("Escribe una contraseña.");
                txtContrasena.requestFocus();
                return;
            }

            if (confirmar.isBlank()) {
                mostrarError("Confirma la contraseña.");
                txtConfirmar.requestFocus();
                return;
            }

            if (!contrasena.equals(confirmar)) {
                mostrarError("Las contraseñas no coinciden.");
                txtConfirmar.requestFocus();
                return;
            }

            if (contrasena.length() < 8) {
                mostrarError(
                        "La contraseña debe tener al menos 8 caracteres."
                );
                txtContrasena.requestFocus();
                return;
            }
        }

        btnGuardar.setDisable(true);

        try {

            if (editando) {

                servicio.actualizarUsuario(
                        usuarioEditar.getId(),
                        usuario,
                        nombre.isEmpty() ? null : nombre,
                        rol,
                        contrasena.isBlank() ? null : contrasena
                );

                mostrarAlerta(
                        Alert.AlertType.INFORMATION,
                        "Usuario actualizado",
                        "Los datos del usuario se actualizaron correctamente."
                );

            } else {

                Usuario nuevoUsuario = new Usuario(
                        usuario,
                        contrasena,
                        nombre.isEmpty() ? null : nombre,
                        rol
                );

                servicio.crearUsuario(nuevoUsuario);

                mostrarAlerta(
                        Alert.AlertType.INFORMATION,
                        "Usuario creado",
                        "El usuario se ha creado correctamente."
                );
            }

            if (alGuardar != null) {
                alGuardar.run();
            }

            cerrarVentana();

        } catch (Exception e) {

            mostrarError(
                    "No se pudo guardar el usuario. "
                    + "Verifica la conexión con la API."
            );

            System.err.println(
                    "Error al guardar usuario: " + e.getMessage()
            );

        } finally {
            btnGuardar.setDisable(false);
        }
    }

    private void mostrarError(String mensaje) {
        txtError.setText(mensaje);
        lblError.setVisible(true);
        lblError.setManaged(true);
    }

    private void ocultarError() {
        if (lblError != null) {
            lblError.setVisible(false);
            lblError.setManaged(false);
        }
    }

    private void cerrarVentana() {

        if (btnGuardar != null && btnGuardar.getScene() != null) {
            ((Stage) btnGuardar.getScene().getWindow()).close();

        } else if (btnCancelar != null
                && btnCancelar.getScene() != null) {
            ((Stage) btnCancelar.getScene().getWindow()).close();
        }
    }

    private void mostrarAlerta(
            Alert.AlertType tipo,
            String titulo,
            String mensaje
    ) {
        Alert alerta = new Alert(tipo);
        alerta.setTitle(titulo);
        alerta.setHeaderText(null);
        alerta.setContentText(mensaje);
        alerta.showAndWait();
    }
}
