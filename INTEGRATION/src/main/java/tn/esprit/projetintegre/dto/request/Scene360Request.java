package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scene360Request {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String thumbnailUrl;

    @Min(value = 0, message = "Order index must be positive")
    private Integer orderIndex;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double initialYaw;

    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double initialPitch;

    @Min(value = 10, message = "FOV must be at least 10")
    @Max(value = 120, message = "FOV cannot exceed 120")
    private Integer initialFov;

    private List<String> hotspots;

    @NotNull(message = "Virtual Tour ID is required")
    private Long virtualTourId;
}
