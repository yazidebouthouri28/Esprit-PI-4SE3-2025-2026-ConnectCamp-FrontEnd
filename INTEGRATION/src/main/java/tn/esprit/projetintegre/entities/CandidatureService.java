package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutCandidature;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "candidatures_service", indexes = {
    @Index(name = "idx_cand_user", columnList = "user_id"),
    @Index(name = "idx_cand_service", columnList = "service_id"),
    @Index(name = "idx_cand_statut", columnList = "statut")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidatureService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro de candidature est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String numeroCandidature;

    @NotBlank(message = "La lettre de motivation est obligatoire")
    @Size(max = 5000, message = "La lettre ne peut pas dépasser 5000 caractères")
    @Column(length = 5000)
    private String lettreMotivation;

    @Size(max = 2000, message = "L'expérience ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String experiencePertinente;

    @ElementCollection
    @CollectionTable(name = "candidature_competences", joinColumns = @JoinColumn(name = "candidature_id"))
    @Column(name = "competence")
    @Builder.Default
    private List<String> competences = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    @Size(max = 2000, message = "Les notes ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String notesEvaluation;

    @Min(value = 0, message = "Le score doit être positif")
    @Max(value = 100, message = "Le score ne peut pas dépasser 100")
    private Integer scoreEvaluation;

    private LocalDateTime dateEntretien;
    private LocalDateTime dateDecision;

    @Size(max = 1000, message = "Le motif de refus ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String motifRefus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User candidat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private CampingService service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluateur_id")
    private User evaluateur;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroCandidature == null) {
            numeroCandidature = "CAND-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
