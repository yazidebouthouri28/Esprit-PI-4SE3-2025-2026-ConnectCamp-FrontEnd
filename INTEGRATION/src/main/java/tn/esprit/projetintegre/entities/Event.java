package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_event_status", columnList = "status"),
        @Index(name = "idx_event_organizer", columnList = "organizer_id"),
        @Index(name = "idx_event_site", columnList = "site_id"),
        @Index(name = "idx_event_dates", columnList = "startDate,endDate"),
        @Index(name = "idx_event_category", columnList = "category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre de l'événement est obligatoire")
    @Size(min = 3, max = 200, message = "Le titre doit contenir entre 3 et 200 caractères")
    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id")
    @NotNull(message = "L'organisateur est obligatoire")
    private Organizer organizer;

    @Size(max = 100, message = "Le type d'événement ne peut pas dépasser 100 caractères")
    private String eventType;

    @Size(max = 100, message = "La catégorie ne peut pas dépasser 100 caractères")
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDateTime endDate;

    private LocalDateTime registrationDeadline;

    @Min(value = 1, message = "Le nombre maximum de participants doit être au moins 1")
    @Max(value = 100000, message = "Le nombre maximum de participants ne peut pas dépasser 100000")
    private Integer maxParticipants;

    @Min(value = 0, message = "Le nombre de participants ne peut pas être négatif")
    @Builder.Default
    private Integer currentParticipants = 0;

    @DecimalMin(value = "0.00", message = "Le prix ne peut pas être négatif")
    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Builder.Default
    private Boolean isFree = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_images", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Size(max = 500, message = "L'URL de la miniature ne peut pas dépasser 500 caractères")
    private String thumbnail;

    @Size(max = 500, message = "Le lieu ne peut pas dépasser 500 caractères")
    private String location;

    @DecimalMin(value = "-90.0", message = "Latitude invalide")
    @DecimalMax(value = "90.0", message = "Latitude invalide")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0", message = "Longitude invalide")
    private Double longitude;

    @Builder.Default
    private Boolean isPublic = true;

    @Builder.Default
    private Boolean requiresApproval = false;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Ticket> tickets = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "event_gamifications", joinColumns = @JoinColumn(name = "event_id"), inverseJoinColumns = @JoinColumn(name = "gamification_id"))
    @Builder.Default
    private Set<Gamification> gamifications = new HashSet<>();

    @DecimalMin(value = "0.00", message = "La note ne peut pas être négative")
    @DecimalMax(value = "5.00", message = "La note ne peut pas dépasser 5")
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Min(value = 0, message = "Le nombre d'avis ne peut pas être négatif")
    @Builder.Default
    private Integer reviewCount = 0;

    @Min(value = 0, message = "Le nombre de vues ne peut pas être négatif")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)
            status = EventStatus.DRAFT;
        if (currentParticipants == null)
            currentParticipants = 0;
        if (reviewCount == null)
            reviewCount = 0;
        if (viewCount == null)
            viewCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @AssertTrue(message = "La date de fin doit être après la date de début")
    private boolean isEndDateAfterStartDate() {
        if (startDate == null || endDate == null)
            return true;
        return !endDate.isBefore(startDate);
    }

    @AssertTrue(message = "La date limite d'inscription doit être avant la date de début")
    private boolean isRegistrationDeadlineBeforeStart() {
        if (registrationDeadline == null || startDate == null)
            return true;
        return registrationDeadline.isBefore(startDate);
    }
}
