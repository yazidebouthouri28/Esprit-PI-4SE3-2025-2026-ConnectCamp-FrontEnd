package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.ServiceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_services", indexes = {
    @Index(name = "idx_evtsvc_event", columnList = "event_id"),
    @Index(name = "idx_evtsvc_type", columnList = "serviceType")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du service est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de service est obligatoire")
    private ServiceType serviceType;

    @DecimalMin(value = "0.0", message = "Le prix doit être positif")
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    private Boolean included = false;

    @Builder.Default
    private Boolean optional = true;

    @Min(value = 0, message = "La quantité doit être positive")
    @Builder.Default
    private Integer quantity = 1;

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private User provider;

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
