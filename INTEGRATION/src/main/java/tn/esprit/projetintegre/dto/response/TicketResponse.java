package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private String ticketType;
    private BigDecimal price;
    private TicketStatus status;
    private String qrCode;
    private String barcode;
    private Long eventId;
    private String eventTitle;
    private Long userId;
    private String userName;
    private Boolean isTransferable;
    private Boolean isRefundable;
    private LocalDateTime purchasedAt;
    private LocalDateTime usedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
