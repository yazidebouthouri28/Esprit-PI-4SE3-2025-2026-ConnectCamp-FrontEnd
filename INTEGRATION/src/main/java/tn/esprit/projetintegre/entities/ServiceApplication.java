package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.ServiceApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_applications", indexes = {
    @Index(name = "idx_service_app_user", columnList = "user_id"),
    @Index(name = "idx_service_app_service", columnList = "service_id"),
    @Index(name = "idx_service_app_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String applicationNumber;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères")
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 20, max = 2000, message = "La description doit contenir entre 20 et 2000 caractères")
    @Column(nullable = false, length = 2000)
    private String description;

    @NotNull(message = "Le statut est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceApplicationStatus status = ServiceApplicationStatus.PENDING;

    @Size(max = 500, message = "Les qualifications ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String qualifications;

    @Size(max = 500, message = "L'expérience ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String experience;

    @DecimalMin(value = "0.0", message = "Le tarif proposé doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal proposedRate;

    @Size(max = 500, message = "La disponibilité ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String availability;

    @Size(max = 500, message = "Le portfolio ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String portfolioUrl;

    @Size(max = 500, message = "Le CV ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String cvUrl;

    @Size(max = 1000, message = "La motivation ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String motivation;

    @Size(max = 1000, message = "La réponse ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String reviewNotes;

    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "L'utilisateur est obligatoire")
    private User applicant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @NotNull(message = "Le service est obligatoire")
    private CampingService service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        appliedAt = LocalDateTime.now();
        if (applicationNumber == null) {
            applicationNumber = "APP-" + System.currentTimeMillis();
        }
        if (status == null) {
            status = ServiceApplicationStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
