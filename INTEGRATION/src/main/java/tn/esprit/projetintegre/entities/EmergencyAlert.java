package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.enums.EmergencyType;
import tn.esprit.projetintegre.enums.EmergencySeverity;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts", indexes = {
    @Index(name = "idx_emergency_site", columnList = "site_id"),
    @Index(name = "idx_emergency_type", columnList = "emergency_type"),
    @Index(name = "idx_emergency_severity", columnList = "severity"),
    @Index(name = "idx_emergency_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String alertCode;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères")
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
    @Column(nullable = false, length = 2000)
    private String description;

    @NotNull(message = "Le type d'urgence est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "emergency_type", nullable = false)
    private EmergencyType emergencyType;

    @NotNull(message = "La sévérité est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmergencySeverity severity;

    @NotNull(message = "Le statut est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status = AlertStatus.ACTIVE;

    @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
    private Double longitude;

    @Size(max = 500, message = "La localisation ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String location;

    @Size(max = 500, message = "Les instructions ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String instructions;

    @Size(max = 500, message = "Les coordonnées d'urgence ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String emergencyContacts;

    private Integer affectedPersonsCount;
    private Boolean evacuationRequired = false;
    private Boolean notificationsSent = false;

    private LocalDateTime reportedAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;

    @Size(max = 2000, message = "Les notes de résolution ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String resolutionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id", nullable = false)
    @NotNull(message = "Le rapporteur est obligatoire")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by_id")
    private User acknowledgedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        reportedAt = LocalDateTime.now();
        if (alertCode == null) {
            alertCode = "EMRG-" + System.currentTimeMillis();
        }
        if (status == null) {
            status = AlertStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
