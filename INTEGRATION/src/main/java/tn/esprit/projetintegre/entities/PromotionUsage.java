package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_usages", indexes = {
    @Index(name = "idx_promo_usage_user", columnList = "user_id"),
    @Index(name = "idx_promo_usage_promo", columnList = "promotion_id"),
    @Index(name = "idx_promo_usage_order", columnList = "order_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"promotion_id", "order_id"}, name = "uk_promo_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Le montant de réduction est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant de réduction doit être positif")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @NotNull(message = "Le montant original est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant original doit être positif")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal originalAmount;

    @NotNull(message = "Le montant final est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant final doit être positif")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal finalAmount;

    private LocalDateTime usedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "L'utilisateur est obligatoire")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @NotNull(message = "La promotion est obligatoire")
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        usedAt = LocalDateTime.now();
    }
}
