package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory", indexes = {
    @Index(name = "idx_inv_product", columnList = "product_id"),
    @Index(name = "idx_inv_warehouse", columnList = "warehouse_id"),
    @Index(name = "idx_inv_sku", columnList = "sku")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le SKU est obligatoire")
    @Size(max = 50, message = "Le SKU ne peut pas dépasser 50 caractères")
    private String sku;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 0, message = "La quantité doit être positive")
    @Builder.Default
    private Integer quantity = 0;

    @Min(value = 0, message = "La quantité réservée doit être positive")
    @Builder.Default
    private Integer reservedQuantity = 0;

    @Min(value = 0, message = "La quantité disponible doit être positive")
    @Builder.Default
    private Integer availableQuantity = 0;

    @Min(value = 0, message = "Le seuil d'alerte doit être positif")
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Min(value = 0, message = "Le stock de sécurité doit être positif")
    @Builder.Default
    private Integer safetyStock = 5;

    @Min(value = 0, message = "La quantité de réapprovisionnement doit être positive")
    private Integer reorderQuantity;

    @Size(max = 50, message = "L'emplacement ne peut pas dépasser 50 caractères")
    private String location;

    @Size(max = 20, message = "L'allée ne peut pas dépasser 20 caractères")
    private String aisle;

    @Size(max = 20, message = "L'étagère ne peut pas dépasser 20 caractères")
    private String shelf;

    @Size(max = 20, message = "Le bac ne peut pas dépasser 20 caractères")
    private String bin;

    private LocalDateTime lastStockCheck;
    private LocalDateTime lastRestocked;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        availableQuantity = quantity - reservedQuantity;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        availableQuantity = quantity - reservedQuantity;
    }
}
