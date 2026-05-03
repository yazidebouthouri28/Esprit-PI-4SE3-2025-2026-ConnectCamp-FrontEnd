package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.MovementType;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stockmov_product", columnList = "product_id"),
    @Index(name = "idx_stockmov_warehouse", columnList = "warehouse_id"),
    @Index(name = "idx_stockmov_type", columnList = "movementType"),
    @Index(name = "idx_stockmov_date", columnList = "movementDate")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La référence est obligatoire")
    @Size(max = 50, message = "La référence ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String reference;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de mouvement est obligatoire")
    private MovementType movementType;

    @NotNull(message = "La quantité est obligatoire")
    private Integer quantity;

    @NotNull(message = "Le stock avant est obligatoire")
    private Integer stockBefore;

    @NotNull(message = "Le stock après est obligatoire")
    private Integer stockAfter;

    @Size(max = 1000, message = "La raison ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String reason;

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String notes;

    @Size(max = 100, message = "La référence source ne peut pas dépasser 100 caractères")
    private String sourceReference;

    @Size(max = 50, message = "Le type source ne peut pas dépasser 50 caractères")
    private String sourceType;

    @NotNull(message = "La date de mouvement est obligatoire")
    private LocalDateTime movementDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_warehouse_id")
    private Warehouse fromWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_warehouse_id")
    private Warehouse toWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (movementDate == null) movementDate = LocalDateTime.now();
        if (reference == null) {
            reference = "MOV-" + System.currentTimeMillis();
        }
    }
}
