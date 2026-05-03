package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.projetintegre.enums.MissionType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionRequest {
    @NotBlank(message = "Mission name is required")
    private String name;
    
    private String description;
    private MissionType type;
    private Integer targetValue;
    private Integer rewardPoints;
    private String rewardBadge;
    private String rewardDescription;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private Boolean isRepeatable;
    private String category;
}
