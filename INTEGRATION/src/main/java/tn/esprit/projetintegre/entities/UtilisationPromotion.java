package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisations_promotion", indexes = {
    @Index(name = "idx_utilpromo_promotion", columnList = "promotion_id"),
    @Index(name = "idx_utilpromo_user", columnList = "user_id"),
    @Index(name = "idx_utilpromo_order", columnList = "order_id"),
    @Index(name = "idx_utilpromo_date", columnList = "dateUtilisation")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UtilisationPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La date d'utilisation est obligatoire")
    private LocalDateTime dateUtilisation;

    @NotNull(message = "Le montant de la réduction est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant de la réduction doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal montantReduction;

    @NotNull(message = "Le montant original est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant original doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal montantOriginal;

    @NotNull(message = "Le montant final est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant final doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal montantFinal;

    @Size(max = 50, message = "Le code utilisé ne peut pas dépasser 50 caractères")
    private String codeUtilise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateUtilisation == null) dateUtilisation = LocalDateTime.now();
    }
}
