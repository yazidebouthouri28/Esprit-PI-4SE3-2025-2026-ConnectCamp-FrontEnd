package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRequest {
    @NotBlank(message = "Alert title is required")
    private String title;
    
    private String description;
    private String alertType;
    private String severity;
    private Double latitude;
    private Double longitude;
    private String location;
    private Long siteId;
}
