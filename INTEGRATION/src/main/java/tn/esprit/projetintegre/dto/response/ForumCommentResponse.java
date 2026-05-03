package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumCommentResponse {
    private Long id;
    private Long articleId;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private Integer likeCount;
    private Boolean isApproved;
    private Long parentId;
    private List<ForumCommentResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
