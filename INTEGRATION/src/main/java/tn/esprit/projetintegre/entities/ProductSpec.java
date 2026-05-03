package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_specs", indexes = {
    @Index(name = "idx_prodspec_product", columnList = "product_id"),
    @Index(name = "idx_prodspec_name", columnList = "specName")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom de la spécification est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String specName;

    @NotBlank(message = "La valeur est obligatoire")
    @Size(max = 500, message = "La valeur ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String specValue;

    @Size(max = 50, message = "L'unité ne peut pas dépasser 50 caractères")
    private String unit;

    @Size(max = 50, message = "Le groupe ne peut pas dépasser 50 caractères")
    private String specGroup;

    @Min(value = 0, message = "L'ordre d'affichage doit être positif")
    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean isFilterable = false;

    @Builder.Default
    private Boolean isVisible = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
