package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteRequest {
    @NotBlank(message = "Site name is required")
    @Size(min = 3, max = 200, message = "Site name must be between 3 and 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotBlank(message = "Site type is required")
    private String type;

    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String country;

    @Min(value = -90, message = "Latitude must be valid (>= -90)")
    @Max(value = 90, message = "Latitude must be valid (<= 90)")
    private Double latitude;

    @Min(value = -180, message = "Longitude must be valid (>= -180)")
    @Max(value = 180, message = "Longitude must be valid (<= 180)")
    private Double longitude;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Price per night is required")
    @DecimalMin(value = "0.0", message = "Price per night must be a positive value")
    private BigDecimal pricePerNight;

    private List<String> images;
    private List<String> amenities;

    @Pattern(regexp = "^(\\+?[0-9. ()-]{7,25})?$", message = "Contact phone must be a valid number format")
    private String contactPhone;

    @Email(message = "Contact email must be valid")
    private String contactEmail;

    private Boolean isActive;

    private String checkInTime;
    private String checkOutTime;
    private String houseRules;

    @NotNull(message = "Owner ID is required")
    private Long ownerId;
}
