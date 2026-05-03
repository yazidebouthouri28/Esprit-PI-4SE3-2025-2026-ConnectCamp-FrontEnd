package tn.esprit.projetintegre;

import org.springframework.boot.SpringApplication;

/**
 * Compatibility entrypoint.
 * Keeps existing IDE run configurations working while ensuring
 * the same component scan/auditing behavior as {@link ProjetIntegreApplication}.
 */
public class BackConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjetIntegreApplication.class, args);
    }
}

