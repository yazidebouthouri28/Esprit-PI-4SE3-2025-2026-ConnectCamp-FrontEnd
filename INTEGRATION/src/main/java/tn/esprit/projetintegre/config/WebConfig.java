package tn.esprit.projetintegre.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*") // Permet tous les en-têtes (Authorization, Content-Type, etc.)
                        .exposedHeaders("Authorization") // Expose l'en-tête Authorization au frontend
                        .allowCredentials(true)
                        .maxAge(3600); // Cache la configuration CORS pendant 1 heure
            }
        };
    }
}