package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutAbonnement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "abonnements", indexes = {
    @Index(name = "idx_abon_user", columnList = "user_id"),
    @Index(name = "idx_abon_statut", columnList = "statut"),
    @Index(name = "idx_abon_dates", columnList = "dateDebut, dateFin")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Abonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro d'abonnement est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String numeroAbonnement;

    @NotBlank(message = "Le nom du plan est obligatoire")
    @Size(max = 100, message = "Le nom du plan ne peut pas dépasser 100 caractères")
    private String nomPlan;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String description;

    @NotNull(message = "Le prix mensuel est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix mensuel doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal prixMensuel;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    private LocalDate dateFin;

    private LocalDate prochainPaiement;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAbonnement statut = StatutAbonnement.ACTIF;

    @Builder.Default
    private Boolean renouvellementAuto = true;

    @Size(max = 100, message = "Le moyen de paiement ne peut pas dépasser 100 caractères")
    private String moyenPaiement;

    private LocalDateTime dateAnnulation;

    @Size(max = 500, message = "Le motif d'annulation ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String motifAnnulation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroAbonnement == null) {
            numeroAbonnement = "ABN-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
