package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Site name is required")
    private String name;

    @Column(length = 2000)
    private String description;

    private String type; // CAMPING, BEACH, MOUNTAIN, FOREST, etc.
    private String address;
    private String city;
    private String country;
    private String postalCode;

    private Double latitude;
    private Double longitude;

    @ElementCollection
    @CollectionTable(name = "site_images", joinColumns = @JoinColumn(name = "site_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();

    private String thumbnail;

    @ElementCollection
    @CollectionTable(name = "site_amenities", joinColumns = @JoinColumn(name = "site_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    private Integer capacity;
    private Boolean isActive = true;

    @Column(precision = 15, scale = 2)
    private BigDecimal pricePerNight;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;
    private Integer reviewCount = 0;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL)
    private List<Event> events = new ArrayList<>();

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL)
    private List<Reservation> reservations = new ArrayList<>();

    private String contactPhone;
    private String contactEmail;
    private String website;

    private String checkInTime;
    private String checkOutTime;
    @Column(length = 2000)
    private String houseRules;

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
