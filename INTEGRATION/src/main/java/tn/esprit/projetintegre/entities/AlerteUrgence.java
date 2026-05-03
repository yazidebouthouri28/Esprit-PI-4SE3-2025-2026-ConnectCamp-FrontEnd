package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutAlerte;
import tn.esprit.projetintegre.enums.TypeUrgence;

import java.time.LocalDateTime;

@Entity
@Table(name = "alertes_urgence", indexes = {
    @Index(name = "idx_alerte_statut", columnList = "statut"),
    @Index(name = "idx_alerte_type", columnList = "typeUrgence"),
    @Index(name = "idx_alerte_site", columnList = "site_id"),
    @Index(name = "idx_alerte_date", columnList = "dateSignalement")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlerteUrgence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'urgence est obligatoire")
    private TypeUrgence typeUrgence;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAlerte statut = StatutAlerte.ACTIVE;

    @Min(value = 1, message = "Le niveau de gravité doit être au moins 1")
    @Max(value = 5, message = "Le niveau de gravité ne peut pas dépasser 5")
    @Builder.Default
    private Integer niveauGravite = 3;

    @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
    private Double longitude;

    @Size(max = 500, message = "La localisation ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String localisation;

    @NotNull(message = "La date de signalement est obligatoire")
    private LocalDateTime dateSignalement;

    private LocalDateTime dateResolution;

    @Size(max = 1000, message = "Les notes de résolution ne peuvent pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String notesResolution;

    @Builder.Default
    private Boolean notificationEnvoyee = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signale_par")
    private User signalePar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolu_par")
    private User resoluPar;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dateSignalement == null) dateSignalement = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
