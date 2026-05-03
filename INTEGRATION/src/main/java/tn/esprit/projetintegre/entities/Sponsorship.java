package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sponsorships", indexes = {
    @Index(name = "idx_sponsorship_sponsor", columnList = "sponsor_id"),
    @Index(name = "idx_sponsorship_event", columnList = "event_id"),
    @Index(name = "idx_sponsorship_status", columnList = "status"),
    @Index(name = "idx_sponsorship_dates", columnList = "startDate,endDate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sponsorship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sponsor_id")
    @NotNull(message = "Le sponsor est obligatoire")
    private Sponsor sponsor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    @NotNull(message = "L'événement est obligatoire")
    private Event event;

    @NotBlank(message = "Le type de parrainage est obligatoire")
    @Size(max = 100, message = "Le type de parrainage ne peut pas dépasser 100 caractères")
    private String sponsorshipType;
    
    @Size(max = 50, message = "Le niveau de parrainage ne peut pas dépasser 50 caractères")
    private String sponsorshipLevel;
    
    @Column(length = 1000)
    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;
    
    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;
    
    @NotBlank(message = "La devise est obligatoire")
    @Size(min = 3, max = 3, message = "La devise doit contenir 3 caractères (ex: EUR, USD, TND)")
    private String currency;
    
    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;
    
    @NotNull(message = "La date de fin est obligatoire")
    @Future(message = "La date de fin doit être dans le futur")
    private LocalDate endDate;
    
    @Builder.Default
    private Boolean isPaid = false;
    private LocalDateTime paidAt;
    
    @Size(max = 2000, message = "Les avantages ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String benefits;
    
    @Size(max = 2000, message = "Les livrables ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String deliverables;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @NotBlank(message = "Le statut est obligatoire")
    @Pattern(regexp = "PENDING|APPROVED|PAID|CANCELLED|COMPLETED", message = "Statut invalide")
    private String status;
    
    @Column(length = 500)
    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (isPaid == null) isPaid = false;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    @AssertTrue(message = "La date de fin doit être après la date de début")
    private boolean isEndDateAfterStartDate() {
        if (startDate == null || endDate == null) return true;
        return endDate.isAfter(startDate) || endDate.isEqual(startDate);
    }
}
