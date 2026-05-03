package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TicketRequestStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_requests", indexes = {
    @Index(name = "idx_ticket_request_user", columnList = "user_id"),
    @Index(name = "idx_ticket_request_event", columnList = "event_id"),
    @Index(name = "idx_ticket_request_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String requestNumber;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    @Max(value = 10, message = "La quantité ne peut pas dépasser 10")
    @Column(nullable = false)
    private Integer quantity;

    @NotNull(message = "Le statut est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketRequestStatus status = TicketRequestStatus.PENDING;

    @Size(max = 1000, message = "Le message ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String message;

    @Size(max = 1000, message = "La réponse ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String responseMessage;

    @Column(name = "ticket_type", length = 100)
    private String ticketType;

    @DecimalMin(value = "0.0", message = "Le prix total doit être positif")
    @Column(precision = 15, scale = 2)
    private java.math.BigDecimal totalPrice;

    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime expiresAt;

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "L'utilisateur est obligatoire")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @NotNull(message = "L'événement est obligatoire")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_id")
    private User processedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        requestedAt = LocalDateTime.now();
        if (requestNumber == null) {
            requestNumber = "TR-" + System.currentTimeMillis();
        }
        if (status == null) {
            status = TicketRequestStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
