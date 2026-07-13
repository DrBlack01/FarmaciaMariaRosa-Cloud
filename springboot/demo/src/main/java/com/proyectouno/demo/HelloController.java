package com.proyectouno.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/")
    public String hello() {
        return "¡Hola! Farmacia María Rosa - Backend Spring Boot está funcionando.";
    }

    /**
     * Endpoint de salud para el Health Check de Render.
     * URL: GET /api/health
     * Respuesta: {"status":"UP","application":"Farmacia María Rosa"}
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "Farmacia María Rosa"
        ));
    }
}
