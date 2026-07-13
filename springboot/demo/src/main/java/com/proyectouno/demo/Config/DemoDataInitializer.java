package com.proyectouno.demo.Config;

import com.proyectouno.demo.models.Categoria;
import com.proyectouno.demo.models.Producto;
import com.proyectouno.demo.repository.CategoriaRepository;
import com.proyectouno.demo.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    @Value("${demo-data.enabled:false}")
    private boolean enabled;

    public DemoDataInitializer(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public void run(String... args) {
        if (!enabled || productoRepository.count() > 0) {
            return;
        }

        Categoria medicinas = findOrCreateCategory(
                "Medicinas", "Medicamentos de uso frecuente.", "/assets/img/medicinas.jpg", 1);
        Categoria cuidado = findOrCreateCategory(
                "Cuidado Personal", "Productos para higiene y cuidado diario.", "/assets/img/cuidado-personal.png", 2);
        Categoria vitaminas = findOrCreateCategory(
                "Vitaminas y Suplementos", "Complementos para el bienestar diario.",
                "/assets/img/vitaminas-suplementos.jpg", 3);

        productoRepository.saveAll(List.of(
                product("DEMO-001", "Paracetamol 500 mg", "Tabletas, caja de 20 unidades.", "2.50", 120,
                        medicinas, "/assets/img/paracetamol.jpg", "Genérico", "Paracetamol", "500 mg", "Tableta"),
                product("DEMO-002", "Ibuprofeno 400 mg", "Tabletas, caja de 10 unidades.", "4.90", 80,
                        medicinas, "/assets/img/ibuprofeno.jpg", "Genérico", "Ibuprofeno", "400 mg", "Tableta"),
                product("DEMO-003", "Omeprazol 20 mg", "Cápsulas, caja de 14 unidades.", "6.50", 65,
                        medicinas, "/assets/img/omeprazol.jpg", "Genérico", "Omeprazol", "20 mg", "Cápsula"),
                product("DEMO-004", "Crema hidratante", "Crema de uso diario para manos y cuerpo.", "18.90", 35,
                        cuidado, "/assets/img/crema-hidratante.jpg", "Cuidado diario", null, null, "Crema"),
                product("DEMO-005", "Shampoo cuidado diario", "Shampoo para limpieza y cuidado del cabello.", "22.90", 30,
                        cuidado, "/assets/img/shampoo.jpg", "Cuidado diario", null, null, "Shampoo"),
                product("DEMO-006", "Protector solar SPF 50", "Protección solar de uso diario.", "39.90", 25,
                        cuidado, "/assets/img/protector-solar.jpg", "Cuidado diario", null, "SPF 50", "Loción"),
                product("DEMO-007", "Vitamina C", "Suplemento alimenticio en tabletas.", "15.90", 45,
                        vitaminas, "/assets/img/vitamina-c.png", "Suplementos", "Ácido ascórbico", "500 mg", "Tableta"),
                product("DEMO-008", "Vitamina D3", "Suplemento alimenticio en cápsulas.", "24.90", 40,
                        vitaminas, "/assets/img/vitamina-d3.png", "Suplementos", "Colecalciferol", "1000 UI", "Cápsula"),
                product("DEMO-009", "Multivitamínico", "Fórmula de vitaminas y minerales.", "29.90", 32,
                        vitaminas, "/assets/img/multivitaminico.jpg", "Suplementos", null, null, "Tableta")
        ));

        logger.info("DemoDataInitializer: se crearon 9 productos de ejemplo.");
    }

    private Categoria findOrCreateCategory(String name, String description, String image, int order) {
        return categoriaRepository.findByNombreIgnoreCase(name).orElseGet(() -> {
            Categoria category = new Categoria();
            category.setNombre(name);
            category.setDescripcion(description);
            category.setImagenUrl(image);
            category.setEstado(true);
            category.setOrden(order);
            return categoriaRepository.save(category);
        });
    }

    private Producto product(String code, String name, String description, String price, int stock,
                             Categoria category, String image, String laboratory, String activeIngredient,
                             String concentration, String pharmaceuticalForm) {
        Producto product = new Producto();
        product.setCodigoBarras(code);
        product.setNombre(name);
        product.setDescripcion(description);
        product.setPrecio(new BigDecimal(price));
        product.setStockActual(stock);
        product.setStockMinimo(5);
        product.setCategoria(category);
        product.setImagenPrincipal(image);
        product.setRequiereReceta(false);
        product.setEsControlado(false);
        product.setLaboratorio(laboratory);
        product.setPrincipioActivo(activeIngredient);
        product.setConcentracion(concentration);
        product.setFormaFarmaceutica(pharmaceuticalForm);
        product.setEstado(true);
        return product;
    }
}
