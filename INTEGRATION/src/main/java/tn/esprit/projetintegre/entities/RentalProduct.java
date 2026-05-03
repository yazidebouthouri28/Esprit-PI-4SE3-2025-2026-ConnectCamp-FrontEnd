package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.AvailabilityStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rental_products", indexes = {
    @Index(name = "idx_rentprod_product", columnList = "product_id"),
    @Index(name = "idx_rentprod_status", columnList = "status"),
    @Index(name = "idx_rentprod_rental", columnList = "rental_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RentalProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du produit est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String productName;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String description;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    @Builder.Default
    private Integer quantity = 1;

    @NotNull(message = "Le prix journalier est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix journalier doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @NotNull(message = "Le prix total est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix total doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @DecimalMin(value = "0.0", message = "La caution doit être positive")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal depositRequired = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AvailabilityStatus status = AvailabilityStatus.AVAILABLE;

    @Size(max = 500, message = "L'état initial ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String initialCondition;

    @Size(max = 500, message = "L'état de retour ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String returnCondition;

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", nullable = false)
    private Rental rental;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
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
