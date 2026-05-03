package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import tn.esprit.projetintegre.enums.SponsorTier;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sponsors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(min = 5, max = 100, message = "Name must be between 5 and 100 characters")
    @NotBlank(message = "Sponsor name is required")
    private String name;

    @Column(length = 2000)
    private String description;

    private String logo;
    private String website;
    
    @Email
    private String email;
    
    private String phone;
    private String address;
    private String city;
    private String country;
    
    private String contactPerson;
    private String contactPosition;
    
    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    private SponsorTier tier = SponsorTier.BRONZE;
    
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "sponsor", cascade = CascadeType.ALL)
    private List<Sponsorship> sponsorships = new ArrayList<>();

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
