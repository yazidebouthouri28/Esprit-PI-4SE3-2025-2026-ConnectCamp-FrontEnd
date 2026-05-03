package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.StatutTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "factures", indexes = {
    @Index(name = "idx_facture_numero", columnList = "numeroFacture"),
    @Index(name = "idx_facture_user", columnList = "user_id"),
    @Index(name = "idx_facture_statut", columnList = "statut"),
    @Index(name = "idx_facture_date", columnList = "dateEmission")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro de facture est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String numeroFacture;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate dateEmission;

    private LocalDate dateEcheance;
    private LocalDate datePaiement;

    @NotNull(message = "Le montant HT est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant HT doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal montantHT;

    @DecimalMin(value = "0.0", message = "Le montant TVA doit être positif")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal montantTVA = BigDecimal.ZERO;

    @NotNull(message = "Le montant TTC est obligatoire")
    @DecimalMin(value = "0.0", message = "Le montant TTC doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal montantTTC;

    @DecimalMin(value = "0.0", message = "Le montant payé doit être positif")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutTransaction statut = StatutTransaction.EN_ATTENTE;

    @Size(max = 2000, message = "Les notes ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String notes;

    private String pdfUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abonnement_id")
    private Abonnement abonnement;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroFacture == null) {
            numeroFacture = "FAC-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
