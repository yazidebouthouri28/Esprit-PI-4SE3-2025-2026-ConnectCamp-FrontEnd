package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String eventType;
    private String category;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private BigDecimal price;
    private Boolean isFree;
    private List<String> images;
    private String thumbnail;
    private Integer viewCount;
    private Double latitude; // ← EST-CE QUE C’EST ICI ?
    private Double longitude;
    private EventStatus status;
    private Long siteId;
    private String siteName;
    private Long organizerId;
    private String organizerName;
    private List<GamificationResponse> gamifications;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
