package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Scene360Response {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String thumbnailUrl;
    private Integer orderIndex;
    private Double initialYaw;
    private Double initialPitch;
    private Integer initialFov;
    private List<String> hotspots;
}
