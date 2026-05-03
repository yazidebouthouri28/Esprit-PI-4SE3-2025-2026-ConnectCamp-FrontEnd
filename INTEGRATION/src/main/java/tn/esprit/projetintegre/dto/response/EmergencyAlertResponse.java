package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.EmergencySeverity;
import tn.esprit.projetintegre.enums.AlertStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlertResponse {
    private Long id;
    private String alertNumber;
    private String title;
    private String description;
    private String alertType;
    private EmergencySeverity severity;
    private AlertStatus status;
    private Double latitude;
    private Double longitude;
    private String location;
    private Long siteId;
    private String siteName;
    private Long reportedById;
    private String reportedByName;
    private Long resolvedById;
    private String resolvedByName;
    private String resolutionNotes;
    private Boolean notificationSent;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
