package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenes_360", indexes = {
    @Index(name = "idx_scene_tour", columnList = "virtual_tour_id"),
    @Index(name = "idx_scene_order", columnList = "orderIndex")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Scene360 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String description;

    @NotBlank(message = "L'URL de l'image est obligatoire")
    private String imageUrl;

    private String thumbnailUrl;

    @Min(value = 0, message = "L'index doit être positif")
    @Builder.Default
    private Integer orderIndex = 0;

    @DecimalMin(value = "-180.0", message = "La longitude initiale doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude initiale doit être entre -180 et 180")
    private Double initialYaw;

    @DecimalMin(value = "-90.0", message = "La latitude initiale doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude initiale doit être entre -90 et 90")
    private Double initialPitch;

    @Min(value = 10, message = "Le FOV doit être au moins 10")
    @Max(value = 120, message = "Le FOV ne peut pas dépasser 120")
    @Builder.Default
    private Integer initialFov = 90;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "scene_hotspots", joinColumns = @JoinColumn(name = "scene_id"))
    @Column(name = "hotspot_data", length = 1000)
    @Builder.Default
    private List<String> hotspots = new ArrayList<>();

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
