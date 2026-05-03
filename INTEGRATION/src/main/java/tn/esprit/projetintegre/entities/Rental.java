package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.RentalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rentals", indexes = {
    @Index(name = "idx_rental_number", columnList = "rentalNumber"),
    @Index(name = "idx_rental_user", columnList = "user_id"),
    @Index(name = "idx_rental_status", columnList = "status"),
    @Index(name = "idx_rental_dates", columnList = "startDate, endDate")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le numéro de location est obligatoire")
    @Size(max = 50, message = "Le numéro ne peut pas dépasser 50 caractères")
    @Column(unique = true)
    private String rentalNumber;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private LocalDate actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RentalStatus status = RentalStatus.PENDING;

    @NotNull(message = "Le sous-total est obligatoire")
    @DecimalMin(value = "0.0", message = "Le sous-total doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @DecimalMin(value = "0.0", message = "La caution doit être positive")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deposit = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "La réduction doit être positive")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @NotNull(message = "Le total est obligatoire")
    @DecimalMin(value = "0.0", message = "Le total doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @DecimalMin(value = "0.0", message = "Les frais de retard doivent être positifs")
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lateFees = BigDecimal.ZERO;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String notes;

    @Size(max = 1000, message = "Les conditions ne peuvent pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String returnCondition;

    @Builder.Default
    private Boolean depositReturned = false;

    @OneToMany(mappedBy = "rental", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RentalProduct> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (rentalNumber == null) {
            rentalNumber = "RNT-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @AssertTrue(message = "La date de fin doit être après la date de début")
    private boolean isEndDateAfterStartDate() {
        return endDate == null || startDate == null || !endDate.isBefore(startDate);
    }
}
