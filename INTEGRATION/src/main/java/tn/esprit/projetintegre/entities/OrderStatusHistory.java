package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.OrderStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_history", indexes = {
    @Index(name = "idx_ordstathist_order", columnList = "order_id"),
    @Index(name = "idx_ordstathist_status", columnList = "status"),
    @Index(name = "idx_ordstathist_date", columnList = "changedAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private OrderStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le nouveau statut est obligatoire")
    private OrderStatus status;

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String comment;

    @Size(max = 200, message = "La raison ne peut pas dépasser 200 caractères")
    private String reason;

    @Size(max = 500, message = "L'emplacement ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String location;

    @Size(max = 100, message = "Le numéro de suivi ne peut pas dépasser 100 caractères")
    private String trackingNumber;

    @Size(max = 100, message = "Le transporteur ne peut pas dépasser 100 caractères")
    private String carrier;

    @Builder.Default
    private Boolean notificationSent = false;

    @NotNull(message = "La date de changement est obligatoire")
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (changedAt == null) changedAt = LocalDateTime.now();
    }
}
