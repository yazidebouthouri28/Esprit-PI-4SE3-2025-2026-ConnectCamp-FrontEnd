package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EmergencyType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evacuation_exercises", indexes = {
    @Index(name = "idx_exercise_site", columnList = "site_id"),
    @Index(name = "idx_exercise_date", columnList = "scheduled_date"),
    @Index(name = "idx_exercise_completed", columnList = "is_completed")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvacuationExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String exerciseCode;

    @NotBlank(message = "Le nom de l'exercice est obligatoire")
    @Size(min = 5, max = 200, message = "Le nom doit contenir entre 5 et 200 caractères")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "emergency_type")
    private EmergencyType emergencyType;

    @NotNull(message = "La date prévue est obligatoire")
    @Future(message = "La date prévue doit être dans le futur")
    private LocalDateTime scheduledDate;

    @Min(value = 5, message = "La durée doit être au moins 5 minutes")
    @Max(value = 480, message = "La durée ne peut pas dépasser 480 minutes (8h)")
    private Integer plannedDurationMinutes;

    private Integer actualDurationMinutes;

    @Size(max = 500, message = "Les objectifs ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String objectives;

    @ElementCollection
    @CollectionTable(name = "exercise_scenarios", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "scenario", length = 500)
    private List<String> scenarios = new ArrayList<>();

    @Min(value = 1, message = "Le nombre de participants doit être au moins 1")
    private Integer expectedParticipants;

    private Integer actualParticipants;

    private Boolean isCompleted = false;
    private Boolean wasSuccessful;

    @Size(max = 2000, message = "Les observations ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String observations;

    @Size(max = 2000, message = "Les améliorations ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String improvements;

    @Min(value = 0, message = "Le temps d'évacuation doit être positif")
    private Integer evacuationTimeSeconds;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    @NotNull(message = "Le site est obligatoire")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_id")
    private EmergencyProtocol protocol;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organized_by_id", nullable = false)
    private User organizedBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exercise_participants",
        joinColumns = @JoinColumn(name = "exercise_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> participants = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (exerciseCode == null) {
            exerciseCode = "EVAC-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
