package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "organizers", indexes = {
    @Index(name = "idx_organizer_user", columnList = "user_id"),
    @Index(name = "idx_organizer_company", columnList = "companyName")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Organizer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom de l'entreprise est obligatoire")
    @Size(min = 2, max = 200, message = "Le nom doit contenir entre 2 et 200 caractères")
    private String companyName;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    private String logo;
    private String banner;
    private String website;

    @Size(max = 100, message = "Le numéro SIRET ne peut pas dépasser 100 caractères")
    private String siretNumber;

    @Size(max = 500, message = "L'adresse ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String address;

    @Size(max = 20, message = "Le téléphone ne peut pas dépasser 20 caractères")
    private String phone;

    @DecimalMin(value = "0.0", message = "La note doit être positive")
    @DecimalMax(value = "5.0", message = "La note ne peut pas dépasser 5")
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Min(value = 0, message = "Le nombre d'avis doit être positif")
    @Builder.Default
    private Integer reviewCount = 0;

    @Min(value = 0, message = "Le nombre d'événements doit être positif")
    @Builder.Default
    private Integer totalEvents = 0;

    @Builder.Default
    private Boolean verified = false;

    @Builder.Default
    private Boolean active = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @OneToMany(mappedBy = "organizer", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Event> events = new ArrayList<>();

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
