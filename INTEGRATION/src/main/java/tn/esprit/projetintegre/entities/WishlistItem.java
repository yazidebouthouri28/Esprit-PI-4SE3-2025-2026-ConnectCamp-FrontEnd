package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist_items", indexes = {
    @Index(name = "idx_wishitem_wishlist", columnList = "wishlist_id"),
    @Index(name = "idx_wishitem_product", columnList = "product_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @DecimalMin(value = "0.0", message = "Le prix au moment de l'ajout doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal priceWhenAdded;

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String notes;

    @Min(value = 1, message = "La priorité doit être au moins 1")
    @Max(value = 5, message = "La priorité ne peut pas dépasser 5")
    @Builder.Default
    private Integer priority = 3;

    @Builder.Default
    private Boolean notifyOnPriceDrop = false;

    @Builder.Default
    private Boolean notifyOnBackInStock = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wishlist_id", nullable = false)
    private Wishlist wishlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
}
