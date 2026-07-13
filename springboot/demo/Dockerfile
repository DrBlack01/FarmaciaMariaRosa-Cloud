# =============================================
# Dockerfile - Farmacia María Rosa Backend
# Compilación multietapa con Java 21 + Maven
# Compatible con Render (detección Docker automática)
# =============================================

# ---- ETAPA 1: Compilación ----
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copiar primero solo el pom.xml para aprovechar el caché de capas Docker.
# Si solo cambia el código fuente (no las dependencias), esta capa se reutiliza.
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el resto del código fuente
COPY src ./src

# Compilar y empaquetar, omitiendo los tests
RUN mvn clean package -DskipTests -B

# ---- ETAPA 2: Imagen de ejecución ----
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar el JAR generado en la etapa anterior
COPY --from=builder /app/target/demo-0.0.1-SNAPSHOT.jar app.jar

# El puerto es dinámico en Render (variable PORT)
# EXPOSE solo documenta el puerto, no lo establece.
EXPOSE 8081

# Variables de entorno por defecto (pueden sobreescribirse en Render)
ENV SPRING_PROFILES_ACTIVE=prod

# Ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
