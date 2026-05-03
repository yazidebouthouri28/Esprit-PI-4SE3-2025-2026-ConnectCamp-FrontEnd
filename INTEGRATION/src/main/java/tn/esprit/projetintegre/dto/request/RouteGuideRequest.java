package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteGuideRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name cannot exceed 200 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotBlank(message = "Origin city is required")
    private String originCity;

    @Min(value = 0, message = "Distance must be positive")
    private Double distanceKm;

    @Min(value = 0, message = "Duration must be positive")
    private Integer estimatedDurationMinutes;

    @Size(max = 50)
    private String difficulty;

    private String instructions;

    private String mapUrl;

    private List<String> waypoints;

    private Boolean isActive;

    @NotNull(message = "Site ID is required")
    private Long siteId;

    private Long virtualTourId;
}
