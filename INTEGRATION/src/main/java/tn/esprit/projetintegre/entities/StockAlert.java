package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.AlertType;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_alerts", indexes = {
    @Index(name = "idx_stockalert_product", columnList = "product_id"),
    @Index(name = "idx_stockalert_type", columnList = "alertType"),
    @Index(name = "idx_stockalert_resolved", columnList = "isResolved")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'alerte est obligatoire")
    private AlertType alertType;

    @Size(max = 500, message = "Le message ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String message;

    @NotNull(message = "Le niveau de stock actuel est obligatoire")
    private Integer currentStock;

    @NotNull(message = "Le seuil est obligatoire")
    private Integer threshold;

    @Min(value = 1, message = "La sévérité doit être au moins 1")
    @Max(value = 5, message = "La sévérité ne peut pas dépasser 5")
    @Builder.Default
    private Integer severity = 3;

    @Builder.Default
    private Boolean isResolved = false;

    private LocalDateTime resolvedAt;

    @Size(max = 500, message = "Les notes de résolution ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String resolutionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
