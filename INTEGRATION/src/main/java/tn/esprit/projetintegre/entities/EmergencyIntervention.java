package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EmergencyType;
import tn.esprit.projetintegre.enums.EmergencySeverity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "emergency_interventions", indexes = {
    @Index(name = "idx_intervention_alert", columnList = "alert_id"),
    @Index(name = "idx_intervention_status", columnList = "status"),
    @Index(name = "idx_intervention_type", columnList = "intervention_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String interventionCode;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères")
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_type")
    private EmergencyType interventionType;

    @Enumerated(EnumType.STRING)
    private EmergencySeverity severity;

    @NotBlank(message = "Le statut est obligatoire")
    @Size(max = 50, message = "Le statut ne peut pas dépasser 50 caractères")
    @Column(nullable = false, length = 50)
    private String status = "DISPATCHED";

    @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
    private Double longitude;

    @Size(max = 500, message = "Les ressources déployées ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String deployedResources;

    @ElementCollection
    @CollectionTable(name = "intervention_actions", joinColumns = @JoinColumn(name = "intervention_id"))
    @Column(name = "action", length = 500)
    @OrderColumn(name = "action_order")
    private List<String> actionsTaken = new ArrayList<>();

    private Integer injuredCount = 0;
    private Integer evacuatedCount = 0;

    @Min(value = 0, message = "Le temps de réponse doit être positif")
    private Integer responseTimeMinutes;

    private LocalDateTime dispatchedAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime resolvedAt;

    @Size(max = 2000, message = "Le rapport ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    private EmergencyAlert alert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_responder_id")
    private User leadResponder;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "intervention_responders",
        joinColumns = @JoinColumn(name = "intervention_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> responders = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        dispatchedAt = LocalDateTime.now();
        if (interventionCode == null) {
            interventionCode = "INTV-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
