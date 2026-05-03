package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.HighlightCategory;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampHighlightResponse {
    private Long id;
    private String title;
    private String content;
    private HighlightCategory category;
    private String imageUrl;
    private Boolean isPublished;
    private Long siteId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
