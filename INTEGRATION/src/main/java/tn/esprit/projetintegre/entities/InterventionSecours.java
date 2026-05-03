package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutIntervention;
import tn.esprit.projetintegre.enums.TypeUrgence;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interventions_secours", indexes = {
    @Index(name = "idx_interv_statut", columnList = "statut"),
    @Index(name = "idx_interv_alerte", columnList = "alerte_id"),
    @Index(name = "idx_interv_date", columnList = "dateDebut")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterventionSecours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro d'intervention est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String numeroIntervention;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'urgence est obligatoire")
    private TypeUrgence typeUrgence;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutIntervention statut = StatutIntervention.EN_COURS;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @Min(value = 0, message = "La durée doit être positive")
    private Integer dureeMinutes;

    @Size(max = 500, message = "La localisation ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String localisation;

    @ElementCollection
    @CollectionTable(name = "intervention_equipe", joinColumns = @JoinColumn(name = "intervention_id"))
    @Column(name = "membre")
    @Builder.Default
    private List<String> equipeIntervention = new ArrayList<>();

    @Size(max = 2000, message = "Les actions ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String actionsRealisees;

    @Size(max = 2000, message = "Le bilan ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String bilanIntervention;

    @Min(value = 0, message = "Le nombre de personnes évacuées doit être positif")
    @Builder.Default
    private Integer personnesEvacuees = 0;

    @Min(value = 0, message = "Le nombre de blessés doit être positif")
    @Builder.Default
    private Integer nombreBlesses = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alerte_id")
    private AlerteUrgence alerte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private User responsable;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroIntervention == null) {
            numeroIntervention = "INT-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
