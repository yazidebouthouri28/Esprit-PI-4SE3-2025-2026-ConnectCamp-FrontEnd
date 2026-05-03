package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.ComplaintStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private Long id;
    private String complaintNumber;
    private Long userId;
    private String userName;
    private String subject;
    private String description;
    private String category;
    private ComplaintStatus status;
    private String referenceType;
    private Long referenceId;
    private String priority;
    private Long assignedToId;
    private String assignedToName;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
}
