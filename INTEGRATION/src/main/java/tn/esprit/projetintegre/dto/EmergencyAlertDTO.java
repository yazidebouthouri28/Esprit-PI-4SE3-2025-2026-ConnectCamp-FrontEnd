package tn.esprit.projetintegre.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.enums.EmergencyType;
import tn.esprit.projetintegre.enums.EmergencySeverity;

import java.time.LocalDateTime;

public class EmergencyAlertDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Le titre est obligatoire")
        @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères")
        private String title;

        @NotBlank(message = "La description est obligatoire")
        @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
        private String description;

        @NotNull(message = "Le type d'urgence est obligatoire")
        private EmergencyType emergencyType;

        @NotNull(message = "La sévérité est obligatoire")
        private EmergencySeverity severity;

        @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
        @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
        private Double latitude;

        @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
        @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
        private Double longitude;

        @Size(max = 500, message = "La localisation ne peut pas dépasser 500 caractères")
        private String location;

        @Size(max = 500, message = "Les instructions ne peuvent pas dépasser 500 caractères")
        private String instructions;

        @Size(max = 500, message = "Les coordonnées d'urgence ne peuvent pas dépasser 500 caractères")
        private String emergencyContacts;

        private Integer affectedPersonsCount;
        private Boolean evacuationRequired = false;

        private Long siteId;
        private Long eventId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String description;
        private EmergencySeverity severity;
        private AlertStatus status;
        private String location;
        private String instructions;
        private String emergencyContacts;
        private Integer affectedPersonsCount;
        private Boolean evacuationRequired;
        private String resolutionNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String alertCode;
        private String title;
        private String description;
        private EmergencyType emergencyType;
        private EmergencySeverity severity;
        private AlertStatus status;
        private Double latitude;
        private Double longitude;
        private String location;
        private String instructions;
        private String emergencyContacts;
        private Integer affectedPersonsCount;
        private Boolean evacuationRequired;
        private Boolean notificationsSent;
        private LocalDateTime reportedAt;
        private LocalDateTime acknowledgedAt;
        private LocalDateTime resolvedAt;
        private String resolutionNotes;
        private Long siteId;
        private String siteName;
        private Long eventId;
        private String eventTitle;
        private Long reportedById;
        private String reportedByName;
        private Long acknowledgedById;
        private String acknowledgedByName;
        private Long resolvedById;
        private String resolvedByName;
        private LocalDateTime createdAt;
    }
}
