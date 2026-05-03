package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievementResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long achievementId;
    private String achievementName;
    private String achievementBadge;
    private String achievementIcon;
    private String achievementDescription;
    private Integer rewardPoints;
    private Boolean isDisplayed;
    private LocalDateTime unlockedAt;
}
