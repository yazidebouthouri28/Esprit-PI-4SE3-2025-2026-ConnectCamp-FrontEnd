package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupon_usages", indexes = {
    @Index(name = "idx_couponuse_coupon", columnList = "coupon_id"),
    @Index(name = "idx_couponuse_user", columnList = "user_id"),
    @Index(name = "idx_couponuse_order", columnList = "order_id"),
    @Index(name = "idx_couponuse_date", columnList = "usedAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La date d'utilisation est obligatoire")
    private LocalDateTime usedAt;

    @NotNull(message = "Le montant de la réduction est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant de la réduction doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @NotNull(message = "Le montant de la commande est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant de la commande doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal orderAmount;

    @Size(max = 45, message = "L'adresse IP ne peut pas dépasser 45 caractères")
    private String ipAddress;

    @Size(max = 500, message = "Le user agent ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String userAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

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
        if (usedAt == null) usedAt = LocalDateTime.now();
    }
}
