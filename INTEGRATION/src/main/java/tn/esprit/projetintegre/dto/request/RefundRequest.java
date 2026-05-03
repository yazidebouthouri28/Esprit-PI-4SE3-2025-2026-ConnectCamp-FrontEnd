package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;
    
    private BigDecimal amount;
    private String reason;
    private String refundMethod;
}
