package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants", indexes = {
    @Index(name = "idx_prodvar_product", columnList = "product_id"),
    @Index(name = "idx_prodvar_sku", columnList = "sku"),
    @Index(name = "idx_prodvar_active", columnList = "isActive")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le SKU est obligatoire")
    @Size(max = 50, message = "Le SKU ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String sku;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;

    @Size(max = 50, message = "La couleur ne peut pas dépasser 50 caractères")
    private String color;

    @Size(max = 50, message = "La taille ne peut pas dépasser 50 caractères")
    private String size;

    @Size(max = 100, message = "Le matériau ne peut pas dépasser 100 caractères")
    private String material;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @DecimalMin(value = "0.0", message = "Le prix de comparaison doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal compareAtPrice;

    @NotNull(message = "Le stock est obligatoire")
    @Min(value = 0, message = "Le stock doit être positif")
    @Builder.Default
    private Integer stock = 0;

    @DecimalMin(value = "0.0", message = "Le poids doit être positif")
    private Double weight;

    @Size(max = 20, message = "L'unité de poids ne peut pas dépasser 20 caractères")
    private String weightUnit;

    @ElementCollection
    @CollectionTable(name = "variant_images", joinColumns = @JoinColumn(name = "variant_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean isDefault = false;

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
