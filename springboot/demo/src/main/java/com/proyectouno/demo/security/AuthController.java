package com.proyectouno.demo.security;

import com.proyectouno.demo.models.Usuario;
import com.proyectouno.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // ============= REGISTRO (opcional si ya tienes POST /clientes) =============
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String nombre = request.get("nombre");
        String email = request.get("email");
        String password = request.get("password");

        if (nombre == null || nombre.isBlank() || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Nombre, correo y contraseña son obligatorios");
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest().body("La contraseña debe tener al menos 8 caracteres");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (usuarioRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(nombre.trim());
        usuario.setEmail(normalizedEmail);
        usuario.setRol("CLIENTE");
        usuario.setEstado(true);

        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuarioRepository.save(usuario);
        return ResponseEntity.ok("Usuario registrado correctamente");
    }

    // ============= LOGIN =============
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || password == null) {
                return ResponseEntity.status(401).body("Credenciales inválidas");
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email.trim().toLowerCase(), password
                    )
            );

            Usuario user = usuarioRepository.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String token = jwtUtil.generateToken(user.getEmail(), user.getRol());
            return ResponseEntity.ok().body(Map.of(
                    "token", token,
                    "rol", user.getRol(),
                    "email", user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Credenciales inválidas");
        }
    }
}
