package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.SponsorTier;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorResponse {
    private Long id;
    private String name;
    private String description;
    private String logo;
    private String website;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String contactPerson;
    private String contactPosition;
    private String notes;
    private SponsorTier tier;
    private Boolean isActive;
    private Integer sponsorshipCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
