package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.MissionType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionResponse {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
