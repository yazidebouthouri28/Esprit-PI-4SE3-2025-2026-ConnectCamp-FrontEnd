package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campsites", indexes = {
    @Index(name = "idx_campsite_site", columnList = "site_id"),
    @Index(name = "idx_campsite_type", columnList = "type"),
    @Index(name = "idx_campsite_available", columnList = "isAvailable")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Campsite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @NotBlank(message = "Le type est obligatoire")
    @Size(max = 50, message = "Le type ne peut pas dépasser 50 caractères")
    private String type;

    @Min(value = 1, message = "La capacité doit être au moins 1")
    @Builder.Default
    private Integer capacity = 2;

    @NotNull(message = "Le prix par nuit est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @DecimalMin(value = "0.0", message = "La superficie doit être positive")
    private Double areaSquareMeters;

    @Builder.Default
    private Boolean hasElectricity = false;

    @Builder.Default
    private Boolean hasWater = false;

    @Builder.Default
    private Boolean hasShadow = false;

    @Builder.Default
    private Boolean petFriendly = false;

    @ElementCollection
    @CollectionTable(name = "campsite_amenities", joinColumns = @JoinColumn(name = "campsite_id"))
    @Column(name = "amenity")
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "campsite_images", joinColumns = @JoinColumn(name = "campsite_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
    private Double longitude;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

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
