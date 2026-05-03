package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.projetintegre.enums.PromotionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PromotionType type = PromotionType.PERCENTAGE;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(precision = 15, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    private Integer usageLimit;
    @Builder.Default
    private Integer usageCount = 0;
    @Builder.Default
    private Integer usageLimitPerUser = 1;

    @Builder.Default
    private Boolean isActive = true;
    @Builder.Default
    private Boolean isFirstOrderOnly = false;

    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category applicableCategory;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (usageCount == null) usageCount = 0;
        if (usageLimitPerUser == null) usageLimitPerUser = 1;
        if (isActive == null) isActive = true;
        if (isFirstOrderOnly == null) isFirstOrderOnly = false;
        if (type == null) type = PromotionType.PERCENTAGE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        int currentUsage = usageCount != null ? usageCount : 0;
        return Boolean.TRUE.equals(isActive) &&
               (validFrom == null || now.isAfter(validFrom)) && 
               (validUntil == null || now.isBefore(validUntil)) &&
               (usageLimit == null || currentUsage < usageLimit);
    }
}
