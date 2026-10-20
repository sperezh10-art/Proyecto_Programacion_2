    /*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.umg.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umg.api.model.Concierto;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Concierto_Service {

    private static final String BASE_URL =
            "https://proyecto-programacion-2-2ryp.onrender.com/api/conciertos";

    private final HttpClient cliente;
    private final ObjectMapper mapper;

    public Concierto_Service() {
        cliente = HttpClient.newHttpClient();
        mapper = new ObjectMapper();
    }

    // Obtener todos los conciertos
    public List<Concierto> obtenerConciertos() throws Exception {

        HttpRequest solicitud = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/"))
                .GET()
                .build();

        HttpResponse<String> respuesta = cliente.send(
                solicitud,
                HttpResponse.BodyHandlers.ofString()
        );

        verificarRespuesta(respuesta);

        return mapper.readValue(
                respuesta.body(),
                new TypeReference<List<Concierto>>() {}
        );
    }

    // Obtener un concierto por su ID
    public Concierto obtenerConcierto(int id) throws Exception {

        HttpRequest solicitud = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/" + id))
                .GET()
                .build();

        HttpResponse<String> respuesta = cliente.send(
                solicitud,
                HttpResponse.BodyHandlers.ofString()
        );

        verificarRespuesta(respuesta);

        return mapper.readValue(respuesta.body(), Concierto.class);
    }

    // Crear un concierto.
    // La API actual recibe los nombres del artista y del estadio.
    public String crearConcierto(
            String gira,
            String artista,
            String estadio,
            String fecha,
            String hora,
            String estado
    ) throws Exception {

        Map<String, Object> datos = new HashMap<>();
        datos.put("gira", gira);
        datos.put("artista", artista);
        datos.put("estadio", estadio);
        datos.put("fecha", fecha);
        datos.put("hora", hora);
        datos.put("estado", estado);

        String json = mapper.writeValueAsString(datos);

        HttpRequest solicitud = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/create/"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> respuesta = cliente.send(
                solicitud,
                HttpResponse.BodyHandlers.ofString()
        );

        verificarRespuesta(respuesta);
        return respuesta.body();
    }

    // Actualizar un concierto.
    // La API actualiza directamente los campos recibidos.
    public String modificarConcierto(Concierto concierto)
            throws Exception {

        String json = mapper.writeValueAsString(concierto);

        HttpRequest solicitud = HttpRequest.newBuilder()
                .uri(URI.create(
                        BASE_URL + "/update/" + concierto.getId()
                ))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> respuesta = cliente.send(
                solicitud,
                HttpResponse.BodyHandlers.ofString()
        );

        verificarRespuesta(respuesta);
        return respuesta.body();
    }

    // Eliminar un concierto por ID
    public String eliminarConcierto(int id) throws Exception {

        HttpRequest solicitud = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/delete/" + id))
                .DELETE()
                .build();

        HttpResponse<String> respuesta = cliente.send(
                solicitud,
                HttpResponse.BodyHandlers.ofString()
        );

        verificarRespuesta(respuesta);
        return respuesta.body();
    }

    private void verificarRespuesta(
            HttpResponse<String> respuesta
    ) throws Exception {

        int codigo = respuesta.statusCode();

        if (codigo < 200 || codigo >= 300) {
            throw new Exception(
                    "Error HTTP " + codigo + ": " + respuesta.body()
            );
        }
    }
}

