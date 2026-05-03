package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMissionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long missionId;
    private String missionName;
    private Integer currentProgress;
    private Integer targetValue;
    private Boolean isCompleted;
    private Boolean rewardClaimed;
    private Integer rewardPoints;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime rewardClaimedAt;
}
