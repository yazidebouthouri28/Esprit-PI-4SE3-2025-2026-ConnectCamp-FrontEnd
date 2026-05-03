package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TypeExercice;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exercices_evacuation", indexes = {
    @Index(name = "idx_exercice_site", columnList = "site_id"),
    @Index(name = "idx_exercice_date", columnList = "datePlanifiee"),
    @Index(name = "idx_exercice_type", columnList = "typeExercice")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciceEvacuation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String titre;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'exercice est obligatoire")
    private TypeExercice typeExercice;

    @NotNull(message = "La date planifiée est obligatoire")
    private LocalDateTime datePlanifiee;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Min(value = 0, message = "La durée doit être positive")
    private Integer dureeMinutes;

    @Min(value = 0, message = "Le nombre de participants doit être positif")
    private Integer nombreParticipants;

    @Size(max = 2000, message = "Les objectifs ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String objectifs;

    @Size(max = 2000, message = "Le bilan ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String bilan;

    @Min(value = 0, message = "Le score doit être positif")
    @Max(value = 100, message = "Le score ne peut pas dépasser 100")
    private Integer scoreEvaluation;

    @Builder.Default
    private Boolean termine = false;

    @Builder.Default
    private Boolean reussi = false;

    @ElementCollection
    @CollectionTable(name = "exercice_points_amelioration", joinColumns = @JoinColumn(name = "exercice_id"))
    @Column(name = "point", length = 500)
    @Builder.Default
    private List<String> pointsAmelioration = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
