package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.PaymentMethod;

import java.time.LocalDateTime;

@Entity
@Table(name = "modes_paiement", indexes = {
    @Index(name = "idx_modepay_user", columnList = "user_id"),
    @Index(name = "idx_modepay_type", columnList = "type"),
    @Index(name = "idx_modepay_default", columnList = "parDefaut")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModePaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de paiement est obligatoire")
    private PaymentMethod type;

    @Size(max = 100, message = "Le libellé ne peut pas dépasser 100 caractères")
    private String libelle;

    @Size(max = 4, message = "Les 4 derniers chiffres ne peuvent pas dépasser 4 caractères")
    private String dernierChiffres;

    @Size(max = 50, message = "La marque de carte ne peut pas dépasser 50 caractères")
    private String marqueCarte;

    @Size(max = 7, message = "La date d'expiration ne peut pas dépasser 7 caractères")
    private String dateExpiration;

    @Size(max = 100, message = "Le nom du titulaire ne peut pas dépasser 100 caractères")
    private String nomTitulaire;

    @Size(max = 34, message = "L'IBAN ne peut pas dépasser 34 caractères")
    private String iban;

    @Size(max = 11, message = "Le BIC ne peut pas dépasser 11 caractères")
    private String bic;

    @Size(max = 200, message = "L'email PayPal ne peut pas dépasser 200 caractères")
    private String emailPaypal;

    @Builder.Default
    private Boolean parDefaut = false;

    @Builder.Default
    private Boolean actif = true;

    @Builder.Default
    private Boolean verifie = false;

    private LocalDateTime dateVerification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
