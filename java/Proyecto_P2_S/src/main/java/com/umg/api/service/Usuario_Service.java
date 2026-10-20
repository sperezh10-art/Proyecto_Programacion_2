
package com.umg.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.umg.api.model.Usuario;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;

public class Usuario_Service {

    private static final String BASE_URL =
            "https://proyecto-programacion-2-2ryp.onrender.com/api/usuario";

    private final ObjectMapper objectMapper;

    public Usuario_Service() {
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule());
    }

    // Obtener todos los usuarios
    public List<Usuario> obtenerUsuarios() throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpGet request = new HttpGet(BASE_URL + "/");

            try (CloseableHttpResponse response = client.execute(request)) {

                if (response.getCode() != 200) {
                    throw new IOException(
                            "Error al obtener usuarios. HTTP: "
                            + response.getCode()
                    );
                }

                String json = new String(
                        response.getEntity().getContent().readAllBytes(),
                        StandardCharsets.UTF_8
                );

                return objectMapper.readValue(
                        json,
                        new TypeReference<List<Usuario>>() {}
                );
            }
        }
    }

    // Obtener usuarios activos
    public List<Usuario> obtenerUsuariosActivos() throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpGet request = new HttpGet(BASE_URL + "/status");

            try (CloseableHttpResponse response = client.execute(request)) {

                if (response.getCode() != 200) {
                    throw new IOException(
                            "Error al obtener usuarios activos. HTTP: "
                            + response.getCode()
                    );
                }

                String json = new String(
                        response.getEntity().getContent().readAllBytes(),
                        StandardCharsets.UTF_8
                );

                return objectMapper.readValue(
                        json,
                        new TypeReference<List<Usuario>>() {}
                );
            }
        }
    }

    // Crear usuario
    public Usuario crearUsuario(Usuario usuario) throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpPost request = new HttpPost(BASE_URL + "/create/");

            String json = objectMapper.writeValueAsString(usuario);

            request.setEntity(
                    new StringEntity(json, ContentType.APPLICATION_JSON)
            );

            try (CloseableHttpResponse response = client.execute(request)) {

                int statusCode = response.getCode();

                String responseJson = response.getEntity() == null
                        ? ""
                        : new String(
                                response.getEntity().getContent().readAllBytes(),
                                StandardCharsets.UTF_8
                        );

                if (statusCode != 200 && statusCode != 201) {
                    throw new IOException(
                            "Error al crear usuario. HTTP: "
                            + statusCode + ". " + responseJson
                    );
                }

                return objectMapper.readValue(
                        responseJson,
                        Usuario.class
                );
            }
        }
    }

    // Editar los datos de un usuario
    public void actualizarUsuario(
            int id,
            String usuario,
            String nombre,
            String rol,
            String contrasena
    ) throws IOException {

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("usuario", usuario);
        datos.put("nombre", nombre);
        datos.put("rol", rol);

        // Solo enviar la contraseña si se desea cambiar.
        if (contrasena != null && !contrasena.isBlank()) {
            datos.put("contrasena", contrasena);
        }

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpPut request = new HttpPut(
                    BASE_URL + "/update/" + id
            );

            String json = objectMapper.writeValueAsString(datos);

            request.setEntity(
                    new StringEntity(json, ContentType.APPLICATION_JSON)
            );

            try (CloseableHttpResponse response = client.execute(request)) {

                int statusCode = response.getCode();

                String responseJson = response.getEntity() == null
                        ? ""
                        : new String(
                                response.getEntity().getContent().readAllBytes(),
                                StandardCharsets.UTF_8
                        );

                if (statusCode < 200 || statusCode >= 300) {
                    throw new IOException(
                            "Error al actualizar usuario. HTTP: "
                            + statusCode + ". " + responseJson
                    );
                }
            }
        }
    }

    // Cambiar el estado de un usuario
    public void cambiarEstado(int id, boolean estado) throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpPut request = new HttpPut(
                    BASE_URL + "/update/" + id
            );

            String json = objectMapper.writeValueAsString(
                    Map.of("status", estado)
            );

            request.setEntity(
                    new StringEntity(json, ContentType.APPLICATION_JSON)
            );

            try (CloseableHttpResponse response = client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200) {

                    String responseJson = response.getEntity() == null
                            ? ""
                            : new String(
                                    response.getEntity().getContent().readAllBytes(),
                                    StandardCharsets.UTF_8
                            );

                    throw new IOException(
                            "Error al cambiar el estado. HTTP: "
                            + statusCode + ". " + responseJson
                    );
                }
            }
        }
    }
}
