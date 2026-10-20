package com.umg.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umg.api.model.Estadio;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

public class Estadio_Service {

    private static final String BASE_URL =
            "https://proyecto-programacion-2-2ryp.onrender.com/api/estadios";

    private final HttpClient client;
    private final ObjectMapper mapper;

    public Estadio_Service() {
        this.client = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
    }

    public List<Estadio> obtenerEstadios() throws Exception {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {
            throw new Exception(
                    "Error HTTP " + response.statusCode()
                    + ": " + response.body()
            );
        }

        return mapper.readValue(
                response.body(),
                new TypeReference<List<Estadio>>() {}
        );
    }
}