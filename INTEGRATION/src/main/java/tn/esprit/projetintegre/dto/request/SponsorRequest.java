package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.projetintegre.enums.SponsorTier;

// SponsorRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorRequest {
    @NotBlank(message = "Sponsor name is required")
    private String name;
    private String description;
    private String logo;
    private String website;
    @Email(message = "Invalid email format")
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
}
