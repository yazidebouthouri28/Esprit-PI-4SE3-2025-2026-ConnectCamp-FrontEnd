package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_category", columnList = "category_id"),
    @Index(name = "idx_product_seller", columnList = "seller_id"),
    @Index(name = "idx_product_active", columnList = "isActive"),
    @Index(name = "idx_product_price", columnList = "price"),
    @Index(name = "idx_product_sku", columnList = "sku")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du produit est obligatoire")
    @Size(min = 2, max = 200, message = "Le nom doit contenir entre 2 et 200 caractères")
    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
    @DecimalMax(value = "9999999.99", message = "Le prix ne peut pas dépasser 9 999 999,99")
    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @DecimalMin(value = "0.00", message = "Le prix original ne peut pas être négatif")
    @Column(precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @DecimalMin(value = "0.00", message = "Le pourcentage de réduction ne peut pas être négatif")
    @DecimalMax(value = "100.00", message = "Le pourcentage de réduction ne peut pas dépasser 100")
    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Size(max = 50, message = "Le SKU ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String sku;
    
    @Size(max = 50, message = "Le code-barres ne peut pas dépasser 50 caractères")
    private String barcode;
    
    @Size(max = 100, message = "La marque ne peut pas dépasser 100 caractères")
    private String brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @NotNull(message = "Le vendeur est obligatoire")
    private User seller;

    @Min(value = 0, message = "La quantité en stock ne peut pas être négative")
    @Builder.Default
    private Integer stockQuantity = 5000;
    
    @Min(value = 0, message = "Le niveau de stock minimum ne peut pas être négatif")
    @Builder.Default
    private Integer minStockLevel = 5;
    
    @Min(value = 1, message = "Le niveau de stock maximum doit être au moins 1")
    @Builder.Default
    private Integer maxStockLevel = 1000;
    
    @Builder.Default
    private Boolean trackInventory = true;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Size(max = 500, message = "L'URL de la miniature ne peut pas dépasser 500 caractères")
    private String thumbnail;

    @DecimalMin(value = "0.00", message = "La note ne peut pas être négative")
    @DecimalMax(value = "5.00", message = "La note ne peut pas dépasser 5")
    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;
    
    @Min(value = 0, message = "Le nombre d'avis ne peut pas être négatif")
    @Builder.Default
    private Integer reviewCount = 0;
    
    @Min(value = 0, message = "Le nombre de ventes ne peut pas être négatif")
    @Builder.Default
    private Integer salesCount = 0;
    
    @Min(value = 0, message = "Le nombre de vues ne peut pas être négatif")
    @Builder.Default
    private Integer viewCount = 0;

    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Boolean isFeatured = false;
    
    @Builder.Default
    private Boolean isOnSale = false;
    
    @Builder.Default
    private Boolean isRentable = false;

    @DecimalMin(value = "0.00", message = "Le prix de location ne peut pas être négatif")
    @Column(precision = 15, scale = 2)
    private BigDecimal rentalPricePerDay;

    @DecimalMin(value = "0.00", message = "Le poids ne peut pas être négatif")
    private Double weight;
    
    @Size(max = 100, message = "Les dimensions ne peuvent pas dépasser 100 caractères")
    private String dimensions;

    private Double loyaltyPercentage;

    @ElementCollection
    @CollectionTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductReview> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartItem> cartItems = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (stockQuantity == null) stockQuantity = 100;
        if (reviewCount == null) reviewCount = 0;
        if (salesCount == null) salesCount = 0;
        if (viewCount == null) viewCount = 0;
        if (rating == null) rating = BigDecimal.ZERO;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
