package com.proyectouno.demo.Controller;

import com.proyectouno.demo.DTO.ProductoDTO;
import com.proyectouno.demo.models.Producto;
import com.proyectouno.demo.repository.ProductoRepository;
import com.proyectouno.demo.repository.CategoriaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.transaction.annotation.Transactional;

// Importaciones corregidas para seguridad
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority; // ✅ IMPORTACIÓN CORRECTA
import org.springframework.security.authentication.AnonymousAuthenticationToken;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping("/productos")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllProductos() {
        try {
            // Obtener información del usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            String rol = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                    .orElse("ROLE_ANONIMO");
            boolean isAuthenticated = !(authentication instanceof AnonymousAuthenticationToken);
            
            // Obtener productos
            List<ProductoDTO> productos = productoRepository.findAllWithCategoria().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            // Crear respuesta con información del usuario
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", Map.of(
                "email", username,
                "rol", rol.replace("ROLE_", ""),
                "autenticado", isAuthenticated
            ));
            response.put("productos", productos);
            response.put("total", productos.size());
            response.put("mensaje", "Productos cargados exitosamente");
            
            // Log para debugging
            System.out.println("🔐 Usuario autenticado: " + username + " | Rol: " + rol);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener productos: " + e.getMessage()));
        }
    }

    @GetMapping("/productos/{id}")
    public ResponseEntity<?> getProductoById(@PathVariable Long id) {
        try {
            // Obtener información del usuario
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            String rol = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                    .orElse("ROLE_ANONIMO");
            
            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
            
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", Map.of(
                "email", username,
                "rol", rol.replace("ROLE_", ""),
                "autenticado", !(authentication instanceof AnonymousAuthenticationToken)
            ));
            response.put("producto", convertToDTO(producto));
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/productos")
    public ResponseEntity<?> createProducto(@Valid @RequestBody ProductoDTO productoDTO) {
        try {
            // Verificar autenticación
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication instanceof AnonymousAuthenticationToken) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Se requiere autenticación"));
            }
            
            String username = authentication.getName();
            String rol = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                    .orElse("ROLE_ANONIMO");
            
            System.out.println("🛒 Creando producto - Usuario: " + username + " | Rol: " + rol);

            Producto producto = convertToEntity(productoDTO);
            producto.setFechaCreacion(LocalDateTime.now());
            Producto saved = productoRepository.save(producto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", Map.of(
                "email", username,
                "rol", rol.replace("ROLE_", "")
            ));
            response.put("producto", convertToDTO(saved));
            response.put("mensaje", "Producto creado exitosamente");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<?> updateProducto(@PathVariable Long id, @Valid @RequestBody ProductoDTO productoDTO) {
        try {
            // Verificar autenticación
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication instanceof AnonymousAuthenticationToken) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Se requiere autenticación"));
            }
            
            String username = authentication.getName();
            String rol = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                    .orElse("ROLE_ANONIMO");

            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
            updateEntityFromDTO(producto, productoDTO);
            producto.setFechaActualizacion(LocalDateTime.now());
            Producto updated = productoRepository.save(producto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", Map.of(
                "email", username,
                "rol", rol.replace("ROLE_", "")
            ));
            response.put("producto", convertToDTO(updated));
            response.put("mensaje", "Producto actualizado exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<?> deleteProducto(@PathVariable Long id) {
        try {
            // Verificar autenticación
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication instanceof AnonymousAuthenticationToken) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Se requiere autenticación"));
            }
            
            String username = authentication.getName();
            String rol = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                    .orElse("ROLE_ANONIMO");

            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
            productoRepository.delete(producto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", Map.of(
                "email", username,
                "rol", rol.replace("ROLE_", "")
            ));
            response.put("mensaje", "Producto eliminado exitosamente");
            response.put("idProductoEliminado", id);
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // Endpoint adicional para probar autenticación
    @GetMapping("/productos/info-usuario")
    public ResponseEntity<?> getInfoUsuario() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> info = new HashMap<>();
        info.put("nombre", authentication.getName());
        info.put("autoridades", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // ✅ CORREGIDO
                .collect(Collectors.toList()));
        info.put("autenticado", authentication.isAuthenticated());
        info.put("tipoAutenticacion", authentication.getClass().getSimpleName());
        info.put("esAnonimo", authentication instanceof AnonymousAuthenticationToken);
        
        return ResponseEntity.ok(info);
    }

    private ProductoDTO convertToDTO(Producto producto) {
        return new ProductoDTO(producto);
    }

    private Producto convertToEntity(ProductoDTO dto) {
        Producto producto = new Producto();
        producto.setCodigoBarras(dto.getCodigoBarras());
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStockActual(dto.getStockActual());
        producto.setStockMinimo(dto.getStockMinimo() != null ? dto.getStockMinimo() : 5);
        producto.setCategoria(categoriaRepository.findById(dto.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + dto.getIdCategoria())));
        producto.setImagenPrincipal(dto.getImagenPrincipal());
        producto.setImagenesAdicionales(dto.getImagenesAdicionales());
        producto.setRequiereReceta(dto.getRequiereReceta());
        producto.setEsControlado(dto.getEsControlado());
        producto.setFechaVencimiento(dto.getFechaVencimiento());
        producto.setLaboratorio(dto.getLaboratorio());
        producto.setPrincipioActivo(dto.getPrincipioActivo());
        producto.setConcentracion(dto.getConcentracion());
        producto.setFormaFarmaceutica(dto.getFormaFarmaceutica());
        producto.setEstado(dto.getEstado());
        return producto;
    }

    private void updateEntityFromDTO(Producto producto, ProductoDTO dto) {
        producto.setCodigoBarras(dto.getCodigoBarras());
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStockActual(dto.getStockActual());
        producto.setStockMinimo(dto.getStockMinimo() != null ? dto.getStockMinimo() : 5);
        producto.setCategoria(categoriaRepository.findById(dto.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + dto.getIdCategoria())));
        producto.setImagenPrincipal(dto.getImagenPrincipal());
        producto.setImagenesAdicionales(dto.getImagenesAdicionales());
        producto.setRequiereReceta(dto.getRequiereReceta());
        producto.setEsControlado(dto.getEsControlado());
        producto.setFechaVencimiento(dto.getFechaVencimiento());
        producto.setLaboratorio(dto.getLaboratorio());
        producto.setPrincipioActivo(dto.getPrincipioActivo());
        producto.setConcentracion(dto.getConcentracion());
        producto.setFormaFarmaceutica(dto.getFormaFarmaceutica());
        producto.setEstado(dto.getEstado());
    }
}

@ControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}

class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
