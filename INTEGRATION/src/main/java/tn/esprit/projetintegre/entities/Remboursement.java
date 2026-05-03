package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutRemboursement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "remboursements", indexes = {
    @Index(name = "idx_remb_numero", columnList = "numeroRemboursement"),
    @Index(name = "idx_remb_user", columnList = "user_id"),
    @Index(name = "idx_remb_order", columnList = "order_id"),
    @Index(name = "idx_remb_statut", columnList = "statut")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Remboursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro de remboursement est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String numeroRemboursement;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
    @Column(precision = 10, scale = 2)
    private BigDecimal montant;

    @NotBlank(message = "La raison est obligatoire")
    @Size(max = 1000, message = "La raison ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String raison;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutRemboursement statut = StatutRemboursement.EN_ATTENTE;

    @Size(max = 100, message = "La méthode de remboursement ne peut pas dépasser 100 caractères")
    private String methodeRemboursement;

    @Size(max = 100, message = "L'ID de transaction ne peut pas dépasser 100 caractères")
    private String transactionId;

    private LocalDateTime dateDemande;
    private LocalDateTime dateTraitement;

    @Size(max = 1000, message = "Les notes admin ne peuvent pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String notesAdmin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par")
    private User traitePar;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroRemboursement == null) {
            numeroRemboursement = "RMB-" + System.currentTimeMillis();
        }
        if (dateDemande == null) dateDemande = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
