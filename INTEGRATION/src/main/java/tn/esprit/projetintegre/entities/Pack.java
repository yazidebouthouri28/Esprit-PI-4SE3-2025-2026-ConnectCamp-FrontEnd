package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.PackType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "packs", indexes = {
    @Index(name = "idx_pack_site", columnList = "site_id"),
    @Index(name = "idx_pack_type", columnList = "pack_type"),
    @Index(name = "idx_pack_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du pack est obligatoire")
    @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
    @Column(nullable = false, length = 2000)
    private String description;

    @NotNull(message = "Le type de pack est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "pack_type", nullable = false)
    private PackType packType;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif ou nul")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @DecimalMin(value = "0.0", message = "Le prix original doit être positif ou nul")
    @Column(precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @Min(value = 1, message = "La durée doit être au moins 1 jour")
    @Max(value = 365, message = "La durée ne peut pas dépasser 365 jours")
    private Integer durationDays;

    @Min(value = 1, message = "Le nombre de personnes doit être au moins 1")
    @Max(value = 100, message = "Le nombre de personnes ne peut pas dépasser 100")
    private Integer maxPersons;

    @Column(length = 500)
    private String image;

    @ElementCollection
    @CollectionTable(name = "pack_images", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "image_url", length = 500)
    private List<String> images = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pack_features", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "feature", length = 255)
    private List<String> features = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pack_inclusions", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "inclusion", length = 255)
    private List<String> inclusions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pack_exclusions", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "exclusion", length = 255)
    private List<String> exclusions = new ArrayList<>();

    private Boolean isActive = true;
    private Boolean isFeatured = false;
    private Boolean isLimitedOffer = false;

    @Min(value = 0, message = "La quantité disponible doit être positive")
    private Integer availableQuantity;

    private Integer soldCount = 0;

    @DecimalMin(value = "0.0", message = "La note doit être positive")
    @DecimalMax(value = "5.0", message = "La note ne peut pas dépasser 5")
    private Double rating = 0.0;

    private Integer reviewCount = 0;

    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "pack_services",
        joinColumns = @JoinColumn(name = "pack_id"),
        inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private List<CampingService> services = new ArrayList<>();

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

    public BigDecimal getDiscountPercentage() {
        if (originalPrice != null && originalPrice.compareTo(BigDecimal.ZERO) > 0 && price != null) {
            return originalPrice.subtract(price).divide(originalPrice, 2, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }
}
