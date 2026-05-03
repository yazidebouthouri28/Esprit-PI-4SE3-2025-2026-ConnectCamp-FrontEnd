package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private String type;
    private String actionUrl;
    private Boolean isRead;
    private String referenceType;
    private Long referenceId;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
