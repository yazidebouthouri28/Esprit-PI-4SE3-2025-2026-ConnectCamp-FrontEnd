package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TransactionType;

import java.time.LocalDateTime;

@Entity
@Table(name = "points", indexes = {
    @Index(name = "idx_points_user", columnList = "user_id"),
    @Index(name = "idx_points_type", columnList = "transactionType"),
    @Index(name = "idx_points_date", columnList = "transactionDate")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Points {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Le nombre de points est obligatoire")
    private Integer points;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de transaction est obligatoire")
    private TransactionType transactionType;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String description;

    @Size(max = 100, message = "La référence ne peut pas dépasser 100 caractères")
    private String referenceType;

    private Long referenceId;

    @NotNull(message = "La date de transaction est obligatoire")
    private LocalDateTime transactionDate;

    private LocalDateTime expirationDate;

    @Builder.Default
    private Boolean expired = false;

    @Builder.Default
    private Boolean used = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loyalty_program_id")
    private LoyaltyProgram loyaltyProgram;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionDate == null) transactionDate = LocalDateTime.now();
    }
}
