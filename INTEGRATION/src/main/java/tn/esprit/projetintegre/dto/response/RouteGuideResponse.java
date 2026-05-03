package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteGuideResponse {
    private Long id;
    private String name;
    private String description;
    private Integer estimatedDurationMinutes;
    private Double distanceMeters;
    private String difficulty;
    private List<Long> sceneOrder;
    private List<String> waypoints;
    private Boolean isActive;
    private Long virtualTourId;
}
