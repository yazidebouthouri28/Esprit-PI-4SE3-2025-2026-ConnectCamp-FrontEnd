package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementResponse {
    private Long id;
    private String name;
    private String description;
    private String badge;
    private String icon;
    private Integer requiredPoints;
    private Integer rewardPoints;
    private String category;
    private Integer level;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
