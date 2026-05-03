package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.TicketRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequestResponse {
    private Long id;
    private String requestNumber;
    private Long userId;
    private String userName;
    private Long eventId;
    private String eventTitle;
    private Integer quantity;
    private String ticketType;
    private BigDecimal totalPrice;
    private TicketRequestStatus status;
    private String notes;
    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
