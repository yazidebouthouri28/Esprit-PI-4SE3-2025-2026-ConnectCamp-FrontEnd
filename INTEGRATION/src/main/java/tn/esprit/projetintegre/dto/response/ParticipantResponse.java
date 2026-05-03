package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.TicketStatus;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParticipantResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private TicketStatus status;
    private Boolean checkedIn;
    private LocalDateTime checkedInAt;
    private String notes;
    private String specialNeeds;
    private Long eventId;
    private String eventName;
    private Long userId;
    private String userName;
    private Long ticketId;
    private String ticketNumber;
    private LocalDateTime createdAt;
}
