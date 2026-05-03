package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampsiteCreateRequest {
    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String type;

    @Min(1)
    private Integer capacity;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal pricePerNight;

    private List<String> amenities;
    private List<String> images;

    private Double latitude;
    private Double longitude;

    // Site/location fields (shown in UI)
    private String address;
    private String city;
    private String country;

    // If not provided, backend uses authenticated user as owner
    private Long ownerId;
}

