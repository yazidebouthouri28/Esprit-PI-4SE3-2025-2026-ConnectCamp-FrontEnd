package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "event_schedule_items", indexes = {
    @Index(name = "idx_evtsch_event", columnList = "event_id"),
    @Index(name = "idx_evtsch_time", columnList = "startTime, endTime")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventScheduleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String title;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime startTime;

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime endTime;

    @Min(value = 0, message = "La durée doit être positive")
    private Integer durationMinutes;

    @Size(max = 200, message = "Le lieu ne peut pas dépasser 200 caractères")
    private String location;

    @Size(max = 200, message = "L'intervenant ne peut pas dépasser 200 caractères")
    private String speaker;

    @Size(max = 500, message = "La bio de l'intervenant ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String speakerBio;

    @Size(max = 50, message = "Le type ne peut pas dépasser 50 caractères")
    private String type;

    @Min(value = 0, message = "L'ordre doit être positif")
    @Builder.Default
    private Integer orderIndex = 0;

    @Builder.Default
    private Boolean isBreak = false;

    @Builder.Default
    private Boolean isHighlight = false;

    @ElementCollection
    @CollectionTable(name = "schedule_item_resources", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "resource_url")
    @Builder.Default
    private List<String> resources = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

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

    @AssertTrue(message = "L'heure de fin doit être après l'heure de début")
    private boolean isEndTimeAfterStartTime() {
        return endTime == null || startTime == null || endTime.isAfter(startTime);
    }
}
