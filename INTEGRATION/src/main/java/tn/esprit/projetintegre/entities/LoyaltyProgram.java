package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loyalty_programs", indexes = {
    @Index(name = "idx_loyalty_active", columnList = "isActive"),
    @Index(name = "idx_loyalty_name", columnList = "name")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoyaltyProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    @Column(unique = true)
    private String name;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @NotNull(message = "Les points par euro sont obligatoires")
    @Min(value = 1, message = "Les points par euro doivent être au moins 1")
    @Builder.Default
    private Integer pointsPerEuro = 1;

    @NotNull(message = "La valeur du point est obligatoire")
    @DecimalMin(value = "0.001", message = "La valeur du point doit être positive")
    @Column(precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal pointValue = new BigDecimal("0.01");

    @Min(value = 0, message = "Le seuil de bronze doit être positif")
    @Builder.Default
    private Integer bronzeThreshold = 0;

    @Min(value = 0, message = "Le seuil d'argent doit être positif")
    @Builder.Default
    private Integer silverThreshold = 500;

    @Min(value = 0, message = "Le seuil d'or doit être positif")
    @Builder.Default
    private Integer goldThreshold = 1000;

    @Min(value = 0, message = "Le seuil platine doit être positif")
    @Builder.Default
    private Integer platinumThreshold = 5000;

    @Min(value = 0, message = "Les points minimum pour échange doivent être positifs")
    @Builder.Default
    private Integer minPointsForRedemption = 100;

    @Min(value = 0, message = "La durée de validité doit être positive")
    @Builder.Default
    private Integer pointsValidityDays = 365;

    @ElementCollection
    @CollectionTable(name = "loyalty_benefits", joinColumns = @JoinColumn(name = "program_id"))
    @Column(name = "benefit", length = 500)
    @Builder.Default
    private List<String> benefits = new ArrayList<>();

    @Builder.Default
    private Boolean isActive = true;

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
