package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VirtualTourResponse {
    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private Integer durationMinutes;
    private Integer viewCount;
    private Boolean isActive;
    private Boolean isFeatured;
    private Long siteId;
    private String siteName;
    private List<Scene360Response> scenes;
    private List<RouteGuideResponse> routes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
