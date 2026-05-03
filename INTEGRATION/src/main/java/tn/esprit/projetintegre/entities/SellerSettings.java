package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_settings", indexes = {
    @Index(name = "idx_seller_settings_user", columnList = "user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SellerSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    private Boolean autoAcceptOrders = false;

    @Builder.Default
    private Boolean vacationMode = false;

    private LocalDateTime vacationStart;
    private LocalDateTime vacationEnd;

    @Size(max = 500, message = "Le message de vacances ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String vacationMessage;

    @Min(value = 0, message = "Le délai de traitement doit être positif")
    @Builder.Default
    private Integer processingTime = 3;

    @Size(max = 500, message = "La politique de retour ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String returnPolicy;

    @Size(max = 500, message = "La politique d'expédition ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String shippingPolicy;

    @DecimalMin(value = "0.0", message = "Le montant minimum de commande doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    @DecimalMin(value = "0.0", message = "Les frais de livraison gratuite doivent être positifs")
    @Column(precision = 10, scale = 2)
    private BigDecimal freeShippingThreshold;

    @Builder.Default
    private Boolean acceptReturns = true;

    @Min(value = 0, message = "Le délai de retour doit être positif")
    @Builder.Default
    private Integer returnDays = 14;

    @Builder.Default
    private Boolean emailNotifications = true;

    @Builder.Default
    private Boolean smsNotifications = false;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

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
