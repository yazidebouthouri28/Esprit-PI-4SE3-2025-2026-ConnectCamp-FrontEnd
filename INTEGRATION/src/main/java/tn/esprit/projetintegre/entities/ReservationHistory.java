package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.ReservationStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservation_history", indexes = {
    @Index(name = "idx_res_hist_reservation", columnList = "reservation_id"),
    @Index(name = "idx_res_hist_status", columnList = "status"),
    @Index(name = "idx_res_hist_date", columnList = "changedAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReservationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "L'ancien statut est obligatoire")
    private ReservationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le nouveau statut est obligatoire")
    private ReservationStatus status;

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String comment;

    @Size(max = 100, message = "La raison ne peut pas dépasser 100 caractères")
    private String reason;

    @NotNull(message = "La date de changement est obligatoire")
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

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
