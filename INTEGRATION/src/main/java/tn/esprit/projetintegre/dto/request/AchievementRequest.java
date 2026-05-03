package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementRequest {
    @NotBlank(message = "Achievement name is required")
    private String name;
    
    private String description;
    private String badge;
    private String icon;
    private Integer requiredPoints;
    private Integer rewardPoints;
    private String category;
    private Integer level;
    private Boolean isActive;
}
