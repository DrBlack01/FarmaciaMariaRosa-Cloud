package com.proyectouno.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Autowired
    private CustomAccessDeniedHandler accessDeniedHandler;

    /**
     * Orígenes CORS permitidos.
     * En desarrollo: configurados en application-dev.properties
     * En producción: valor de la variable de entorno FRONTEND_URL en Render
     */
    @Value("${cors.allowed-origins:http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSourceSecuruty()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Rutas públicas sin JWT
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/categorias/**").permitAll()
                    .requestMatchers("/api/chat-ai/**").permitAll()
                    .requestMatchers("/api/clientes/**").permitAll()
                    .requestMatchers("/api/contacto/**").permitAll()
                    .requestMatchers("/api/health").permitAll()

                    // Solo ADMIN puede modificar el catálogo
                    .requestMatchers("/api/productos/**").hasAuthority("ADMIN")
                    .requestMatchers("/api/categorias/**").hasAuthority("ADMIN")

                    // Solo ADMIN accede a estadísticas
                    .requestMatchers("/api/estadisticas/**").hasAuthority("ADMIN")

                    // ADMIN, CAJERO y SECRETARIO pueden gestionar lotes
                    .requestMatchers("/api/lotes/**").hasAnyAuthority("ADMIN", "CAJERO", "SECRETARIO")

                    // Mensajes: ADMIN y SECRETARIO
                    .requestMatchers("/api/mensajes/**").hasAnyAuthority("ADMIN", "SECRETARIO")

                    // Usuarios sin token (CRUD de administración de usuarios)
                    .requestMatchers("/usuarios/**").permitAll()

                    // Todo lo demás requiere autenticación
                    .anyRequest().authenticated()
            );

        http.exceptionHandling(exception -> exception
                .accessDeniedHandler(accessDeniedHandler)
        );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSourceSecuruty() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parsear lista de orígenes desde la property (separados por coma)
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
