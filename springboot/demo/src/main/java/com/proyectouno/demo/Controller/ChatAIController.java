package com.proyectouno.demo.Controller;

import com.proyectouno.demo.DTO.ProductoDTO;
import com.proyectouno.demo.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import io.github.cdimascio.dotenv.Dotenv;

/**
 * Controlador para el chatbot de IA (Groq API - llama-3.1-8b-instant).
 *
 * La clave de API se obtiene de:
 *  1. Variable de entorno del sistema: GROQ_API_KEY
 *  2. Archivo .env local (solo para desarrollo)
 *
 * En producción (Render): configurar GROQ_API_KEY como variable de entorno.
 * Si la clave no está configurada, el endpoint devuelve un mensaje de error
 * amigable sin lanzar excepción en el arranque.
 */
@RestController
@RequestMapping("/api")
public class ChatAIController {

    private static final Logger logger = LoggerFactory.getLogger(ChatAIController.class);

    @Autowired
    private ProductoRepository productoRepository;

    private final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private final String API_KEY;

    public ChatAIController() {
        // 1) Intentar leer desde variable de entorno del sistema (Render, Docker, etc.)
        String envKey = System.getenv("GROQ_API_KEY");

        if (envKey != null && !envKey.isBlank()) {
            this.API_KEY = envKey;
            logger.info("ChatAI: GROQ_API_KEY cargada desde variable de entorno del sistema.");
        } else {
            // 2) Fallback: intentar cargar desde archivo .env (solo local)
            String dotenvKey = null;
            try {
                Dotenv dotenv = Dotenv.configure()
                        .ignoreIfMissing()   // No falla si no existe el .env
                        .ignoreIfMalformed() // No falla si el .env tiene errores de formato
                        .load();
                dotenvKey = dotenv.get("GROQ_API_KEY");
            } catch (Exception e) {
                logger.warn("ChatAI: No se pudo cargar archivo .env: {}", e.getMessage());
            }

            this.API_KEY = dotenvKey;
            if (dotenvKey != null && !dotenvKey.isBlank()) {
                logger.info("ChatAI: GROQ_API_KEY cargada desde archivo .env local.");
            } else {
                logger.warn("ChatAI: GROQ_API_KEY no configurada. El chatbot devolverá un mensaje de error hasta que se configure la variable.");
            }
        }
    }

    @PostMapping("/chat-ai")
    public ResponseEntity<?> chatWithAI(@RequestBody Map<String, String> request) {
        // Si no hay API key configurada, devolver respuesta amigable
        if (API_KEY == null || API_KEY.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("response",
                            "El asistente virtual no está disponible en este momento. " +
                            "Por favor, contacta directamente con la farmacia para obtener información."));
        }

        try {
            String userMessage = request.get("message");

            // Obtener información de productos para el contexto
            List<ProductoDTO> productos = productoRepository.findAllWithCategoria().stream()
                    .map(producto -> new ProductoDTO(producto))
                    .collect(Collectors.toList());

            String productosContext = buildProductosContext(productos);
            String systemPrompt = buildSystemPrompt(productosContext);
            String aiResponse = callGroqAPI(systemPrompt, userMessage);

            return ResponseEntity.ok(Map.of("response", aiResponse));

        } catch (Exception e) {
            logger.error("ChatAI: Error al comunicarse con Groq API: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al comunicarse con la IA: " + e.getMessage()));
        }
    }

    private String buildProductosContext(List<ProductoDTO> productos) {
        StringBuilder context = new StringBuilder();
        context.append("PRODUCTOS DISPONIBLES EN LA FARMACIA:\n\n");

        for (ProductoDTO producto : productos) {
            context.append("• ").append(producto.getNombre())
                   .append(" - Precio: S/ ").append(producto.getPrecio())
                   .append(" - Stock: ").append(producto.getStockActual())
                   .append(" - Categoría: ").append(producto.getCategoriaNombre())
                   .append(" - Requiere receta: ").append(producto.getRequiereReceta() ? "Sí" : "No")
                   .append(" - Controlado: ").append(producto.getEsControlado() ? "Sí" : "No")
                   .append("\n");

            if (producto.getDescripcion() != null && !producto.getDescripcion().isEmpty()) {
                context.append("  Descripción: ").append(producto.getDescripcion()).append("\n");
            }

            if (producto.getLaboratorio() != null && !producto.getLaboratorio().isEmpty()) {
                context.append("  Laboratorio: ").append(producto.getLaboratorio()).append("\n");
            }

            if (producto.getPrincipioActivo() != null && !producto.getPrincipioActivo().isEmpty()) {
                context.append("  Principio activo: ").append(producto.getPrincipioActivo()).append("\n");
            }

            context.append("\n");
        }

        return context.toString();
    }

    private String buildSystemPrompt(String productosContext) {
        return "Eres un asistente virtual especializado de Farmacia María Rosa. " +
               "Tu función es ayudar a los clientes con información sobre productos farmacéuticos, " +
               "recomendaciones generales y consultas sobre disponibilidad.\n\n" +
               "INSTRUCCIONES IMPORTANTES:\n" +
               "1. SOLO responde preguntas relacionadas con medicamentos, productos de salud, y temas farmacéuticos\n" +
               "2. NO proporciones diagnósticos médicos\n" +
               "3. SIEMPRE recomienda consultar con un médico para problemas de salud específicos\n" +
               "4. Usa la siguiente información de productos para responder sobre disponibilidad y precios\n" +
               "5. Sé amable, profesional y útil\n" +
               "6. Si un producto requiere receta, infórmalo claramente\n" +
               "7. Si no sabes algo, reconócelo y sugiere consultar en la farmacia\n\n" +
               productosContext +
               "\nRecuerda: Solo información farmacéutica. Para emergencias médicas, deriva inmediatamente al médico.";
    }

    private String callGroqAPI(String systemPrompt, String userMessage) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            Map<String, Object> requestBody = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.7,
                "max_tokens", 1024
            );

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Bearer " + API_KEY);
            headers.set("Content-Type", "application/json");

            org.springframework.http.HttpEntity<Map<String, Object>> entity =
                new org.springframework.http.HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_API_URL, entity, Map.class);

            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }

            return "Lo siento, no pude procesar tu pregunta en este momento.";

        } catch (Exception e) {
            throw new RuntimeException("Error calling Groq API: " + e.getMessage());
        }
    }
}