/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.umg.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umg.api.model.Artista;
import java.io.IOException;
import java.util.List;
import org.apache.hc.client5.http.classic.methods.HttpDelete;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;

public class Artista_Service {

    private static final String BASE_URL =
            "https://proyecto-programacion-2-2ryp.onrender.com/api/artista";

    private final ObjectMapper objectMapper;

    public Artista_Service() {
        objectMapper = new ObjectMapper();
    }

    // ==========================================
    // OBTENER TODOS LOS ARTISTAS
    // GET /api/artista/
    // ==========================================

    public List<Artista> obtenerArtistas() throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpGet request = new HttpGet(BASE_URL + "/");

            try (CloseableHttpResponse response = client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200) {
                    throw new IOException(
                            "Error al obtener artistas. HTTP: "
                            + statusCode
                    );
                }

                String json = new String(
                        response.getEntity()
                                .getContent()
                                .readAllBytes()
                );

                return objectMapper.readValue(
                        json,
                        new TypeReference<List<Artista>>() {}
                );
            }
        }
    }

    // ==========================================
    // OBTENER ARTISTA POR ID
    // GET /api/artista/:id
    // ==========================================

    public Artista obtenerArtista(int id) throws IOException {

        try (CloseableHttpClient client = HttpClients.createDefault()) {

            HttpGet request =
                    new HttpGet(BASE_URL + "/" + id);

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200) {
                    throw new IOException(
                            "Error al obtener el artista. HTTP: "
                            + statusCode
                    );
                }

                String json = new String(
                        response.getEntity()
                                .getContent()
                                .readAllBytes()
                );

                return objectMapper.readValue(
                        json,
                        Artista.class
                );
            }
        }
    }

    // ==========================================
    // OBTENER ARTISTAS POR STATUS
    // GET /api/artista/status
    // ==========================================

    public List<Artista> obtenerArtistasStatus()
            throws IOException {

        try (CloseableHttpClient client =
                     HttpClients.createDefault()) {

            HttpGet request =
                    new HttpGet(BASE_URL + "/status");

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200) {
                    throw new IOException(
                            "Error al obtener artistas por status. HTTP: "
                            + statusCode
                    );
                }

                String json = new String(
                        response.getEntity()
                                .getContent()
                                .readAllBytes()
                );

                return objectMapper.readValue(
                        json,
                        new TypeReference<List<Artista>>() {}
                );
            }
        }
    }

    // ==========================================
    // CREAR ARTISTA
    // POST /api/artista/create/
    // ==========================================

    public Artista crearArtista(Artista artista)
            throws IOException {

        try (CloseableHttpClient client =
                     HttpClients.createDefault()) {

            HttpPost request =
                    new HttpPost(BASE_URL + "/create/");

            String json =
                    objectMapper.writeValueAsString(artista);

            request.setEntity(
                    new StringEntity(
                            json,
                            ContentType.APPLICATION_JSON
                    )
            );

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200 &&
                    statusCode != 201) {

                    throw new IOException(
                            "Error al crear artista. HTTP: "
                            + statusCode
                    );
                }

                String responseJson = new String(
                        response.getEntity()
                                .getContent()
                                .readAllBytes()
                );

                return objectMapper.readValue(
                        responseJson,
                        Artista.class
                );
            }
        }
    }

    // ==========================================
    // MODIFICAR ARTISTA
    // PUT /api/artista/update/:id
    // ==========================================

    public Artista modificarArtista(
            int id,
            Artista artista
    ) throws IOException {

        try (CloseableHttpClient client =
                     HttpClients.createDefault()) {

            HttpPut request =
                    new HttpPut(
                            BASE_URL + "/update/" + id
                    );

            String json =
                    objectMapper.writeValueAsString(artista);

            request.setEntity(
                    new StringEntity(
                            json,
                            ContentType.APPLICATION_JSON
                    )
            );

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200) {

                    throw new IOException(
                            "Error al modificar artista. HTTP: "
                            + statusCode
                    );
                }

                String responseJson = new String(
                        response.getEntity()
                                .getContent()
                                .readAllBytes()
                );

                return objectMapper.readValue(
                        responseJson,
                        Artista.class
                );
            }
        }
    }

    // ==========================================
    // ELIMINAR ARTISTA
    // DELETE /api/artista/delete/:id
    // ==========================================

    public void eliminarArtista(int id)
            throws IOException {

        try (CloseableHttpClient client =
                     HttpClients.createDefault()) {

            HttpDelete request =
                    new HttpDelete(
                            BASE_URL + "/delete/" + id
                    );

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200 &&
                    statusCode != 204) {

                    throw new IOException(
                            "Error al eliminar artista. HTTP: "
                            + statusCode
                    );
                }
            }
        }
    }

    // ==========================================
    // ELIMINAR TODOS LOS ARTISTAS
    // DELETE /api/artista/delete/
    // ==========================================

    public void eliminarTodos()
            throws IOException {

        try (CloseableHttpClient client =
                     HttpClients.createDefault()) {

            HttpDelete request =
                    new HttpDelete(
                            BASE_URL + "/delete/"
                    );

            try (CloseableHttpResponse response =
                    client.execute(request)) {

                int statusCode = response.getCode();

                if (statusCode != 200 &&
                    statusCode != 204) {

                    throw new IOException(
                            "Error al eliminar artistas. HTTP: "
                            + statusCode
                    );
                }
            }
        }
    }
}