package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TypeCondition;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "conditions_promotion", indexes = {
    @Index(name = "idx_condpromo_promotion", columnList = "promotion_id"),
    @Index(name = "idx_condpromo_type", columnList = "typeCondition")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConditionPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de condition est obligatoire")
    private TypeCondition typeCondition;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String description;

    @DecimalMin(value = "0.0", message = "La valeur minimale doit être positive")
    @Column(precision = 10, scale = 2)
    private BigDecimal valeurMinimale;

    @DecimalMin(value = "0.0", message = "La valeur maximale doit être positive")
    @Column(precision = 10, scale = 2)
    private BigDecimal valeurMaximale;

    @Min(value = 0, message = "La quantité minimale doit être positive")
    private Integer quantiteMinimale;

    private Long categorieId;
    private Long produitId;

    @Size(max = 50, message = "Le code pays ne peut pas dépasser 50 caractères")
    private String codePays;

    @Builder.Default
    private Boolean premiereCommande = false;

    @Builder.Default
    private Boolean clientFidele = false;

    @Min(value = 0, message = "Les points de fidélité requis doivent être positifs")
    private Integer pointsFideliteRequis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
