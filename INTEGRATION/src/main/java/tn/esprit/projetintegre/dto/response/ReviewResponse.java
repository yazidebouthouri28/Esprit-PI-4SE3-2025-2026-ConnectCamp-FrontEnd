package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.ReviewTargetType;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private ReviewTargetType targetType;
    private Long targetId;
    private Integer rating;
    private String title;
    private String comment;
    private List<String> images;
    private Integer likesCount;
    private Boolean verified;
    private Boolean approved;
    private String response;
    private LocalDateTime respondedAt;
    private Long userId;
    private String userName;
    private String userAvatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
