package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumCommentRequest {
    @NotNull(message = "Article ID is required")
    private Long articleId;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private Long parentId;
}
