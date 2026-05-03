package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "route_guides", indexes = {
    @Index(name = "idx_route_tour", columnList = "virtual_tour_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RouteGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String description;

    @Min(value = 0, message = "La durée estimée doit être positive")
    private Integer estimatedDurationMinutes;

    @Min(value = 0, message = "La distance doit être positive")
    private Double distanceMeters;

    @Size(max = 50, message = "La difficulté ne peut pas dépasser 50 caractères")
    private String difficulty;

    @ElementCollection
    @CollectionTable(name = "route_scene_order", joinColumns = @JoinColumn(name = "route_id"))
    @Column(name = "scene_id")
    @OrderColumn(name = "position")
    @Builder.Default
    private List<Long> sceneOrder = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "route_waypoints", joinColumns = @JoinColumn(name = "route_id"))
    @Column(name = "waypoint_data", length = 500)
    @Builder.Default
    private List<String> waypoints = new ArrayList<>();

    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "virtual_tour_id", nullable = false)
    private VirtualTour virtualTour;

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
