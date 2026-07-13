package com.proyectouno.demo.Config;

import com.proyectouno.demo.models.Usuario;
import com.proyectouno.demo.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Inicializador del administrador por defecto.
 *
 * Al arrancar la aplicación:
 *  1. Comprueba si CREATE_DEFAULT_ADMIN está habilitado.
 *  2. Busca si ya existe un usuario con el email configurado.
 *  3. Solo crea el administrador si no existe aún.
 *
 * Variables de entorno (o properties):
 *   admin.email           = ADMIN_EMAIL (default: admin@farmacia.com)
 *   admin.password        = ADMIN_PASSWORD (obligatoria)
 *   admin.create-default  = CREATE_DEFAULT_ADMIN (default: false)
 *
 * NOTA: En producción, cambiar las credenciales en las variables de entorno de Render.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@farmacia.com}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Value("${admin.create-default:false}")
    private boolean createDefaultAdmin;

    public AdminInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!createDefaultAdmin) {
            logger.info("AdminInitializer: Creación del administrador por defecto deshabilitada (CREATE_DEFAULT_ADMIN=false).");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        Usuario admin = usuarioRepository.findByEmail(normalizedEmail).orElse(null);

        if (admin == null) {
            admin = new Usuario();
            admin.setNombre("Administrador");
            admin.setEmail(normalizedEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRol("ADMIN");
            admin.setEstado(true);
            admin.setFechaCreacion(LocalDateTime.now());

            usuarioRepository.save(admin);
            logger.info("AdminInitializer: Administrador '{}' creado exitosamente con rol ADMIN.", normalizedEmail);
            return;
        }

        boolean updated = false;
        if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            updated = true;
        }
        if (!"ADMIN".equals(admin.getRol())) {
            admin.setRol("ADMIN");
            updated = true;
        }
        if (!Boolean.TRUE.equals(admin.getEstado())) {
            admin.setEstado(true);
            updated = true;
        }

        if (updated) {
            admin.setFechaActualizacion(LocalDateTime.now());
            usuarioRepository.save(admin);
            logger.info("AdminInitializer: Configuración del administrador '{}' sincronizada.", normalizedEmail);
        } else {
            logger.info("AdminInitializer: El administrador '{}' ya está actualizado.", normalizedEmail);
        }
        // IMPORTANTE: la contraseña NO se imprime en los logs por seguridad.
    }
}
