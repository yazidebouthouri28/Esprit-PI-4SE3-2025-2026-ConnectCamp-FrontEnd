package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequest {
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    private String ticketType;
    private BigDecimal price;
    private Boolean isTransferable;
    private Boolean isRefundable;
    private Integer quantity;
}
