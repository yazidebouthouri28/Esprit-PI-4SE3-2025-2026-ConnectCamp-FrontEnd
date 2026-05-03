package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_packages", indexes = {
    @Index(name = "idx_testpkg_active", columnList = "isActive")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Min(value = 1, message = "La durée doit être au moins 1 jour")
    private Integer durationDays;

    @ElementCollection
    @CollectionTable(name = "test_package_features", joinColumns = @JoinColumn(name = "package_id"))
    @Column(name = "feature")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "test_package_limitations", joinColumns = @JoinColumn(name = "package_id"))
    @Column(name = "limitation")
    @Builder.Default
    private List<String> limitations = new ArrayList<>();

    @Min(value = 0, message = "Le nombre maximum d'utilisations doit être positif")
    private Integer maxUsages;

    @Builder.Default
    private Boolean isActive = true;

    private LocalDate validFrom;
    private LocalDate validUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private CampingService service;

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
