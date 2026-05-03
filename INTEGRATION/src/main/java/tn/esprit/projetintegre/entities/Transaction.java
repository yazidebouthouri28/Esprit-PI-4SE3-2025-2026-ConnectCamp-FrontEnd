package tn.esprit.projetintegre.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String transactionNumber;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "wallet_id")
    @JsonIgnore
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(precision = 15, scale = 2)
    private BigDecimal balanceBefore;

    @Column(precision = 15, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    private String paymentMethod;
    private String externalTransactionId;

    @Column(length = 500)
    private String description;

    // Dans Transaction.java - Optionnel
    @Column(name = "is_fraud")
    private Boolean isFraud = false;

    @Column(name = "fraud_score")
    private Double fraudScore;

    @Column(name = "fraud_risk_level")
    private String fraudRiskLevel;

    @Column(name = "fraud_probability")
    private Double fraudProbability;

    private String referenceType;
    private Long referenceId;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionNumber == null) {
            transactionNumber = "TXN-" + System.currentTimeMillis();
        }
    }
}
