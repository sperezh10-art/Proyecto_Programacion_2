/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.umg.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Usuario {

    private int id;
    private String usuario;
    private String contrasena;
    private String nombre;
    private String rol;
    private boolean status;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    public Usuario() {
    }

    public Usuario(
            String usuario,
            String contrasena,
            String nombre,
            String rol
    ) {
        this.usuario = usuario;
        this.contrasena = contrasena;
        this.nombre = nombre;
        this.rol = rol;
        this.status = true;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}