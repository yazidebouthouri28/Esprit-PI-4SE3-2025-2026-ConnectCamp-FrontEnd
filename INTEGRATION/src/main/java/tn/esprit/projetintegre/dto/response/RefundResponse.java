package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponse {
    private Long id;
    private String refundNumber;
    private Long orderId;
    private String orderNumber;
    private Long userId;
    private String userName;
    private BigDecimal amount;
    private String reason;
    private PaymentStatus status;
    private String refundMethod;
    private String transactionId;
    private String adminNotes;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
