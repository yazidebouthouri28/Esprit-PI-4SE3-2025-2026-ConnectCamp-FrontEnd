package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EmergencyType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "emergency_protocols", indexes = {
    @Index(name = "idx_protocol_site", columnList = "site_id"),
    @Index(name = "idx_protocol_type", columnList = "emergency_type"),
    @Index(name = "idx_protocol_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyProtocol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String protocolCode;

    @NotBlank(message = "Le nom du protocole est obligatoire")
    @Size(min = 5, max = 200, message = "Le nom doit contenir entre 5 et 200 caractères")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 20, max = 5000, message = "La description doit contenir entre 20 et 5000 caractères")
    @Column(nullable = false, length = 5000)
    private String description;

    @NotNull(message = "Le type d'urgence est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "emergency_type", nullable = false)
    private EmergencyType emergencyType;

    @Size(max = 5000, message = "Les étapes ne peuvent pas dépasser 5000 caractères")
    @Column(length = 5000)
    private String steps;

    @ElementCollection
    @CollectionTable(name = "protocol_steps", joinColumns = @JoinColumn(name = "protocol_id"))
    @Column(name = "step", length = 500)
    @OrderColumn(name = "step_order")
    private List<String> stepsList = new ArrayList<>();

    @Size(max = 500, message = "L'équipement requis ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String requiredEquipment;

    @Size(max = 500, message = "Les coordonnées d'urgence ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String emergencyContacts;

    @Size(max = 500, message = "Le point de rassemblement ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String assemblyPoint;

    @Size(max = 500, message = "Les routes d'évacuation ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String evacuationRoutes;

    @Min(value = 1, message = "Le temps de réponse estimé doit être au moins 1 minute")
    private Integer estimatedResponseTimeMinutes;

    @Min(value = 0, message = "Le niveau de priorité doit être positif")
    @Max(value = 10, message = "Le niveau de priorité ne peut pas dépasser 10")
    private Integer priorityLevel;

    private Boolean isActive = true;
    private Boolean requiresTraining = false;

    private LocalDateTime lastReviewedAt;
    private LocalDateTime nextReviewDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_reviewed_by_id")
    private User lastReviewedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (protocolCode == null) {
            protocolCode = "PROT-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
