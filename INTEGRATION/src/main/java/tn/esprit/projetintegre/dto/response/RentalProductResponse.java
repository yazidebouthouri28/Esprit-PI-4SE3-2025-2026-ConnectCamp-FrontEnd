package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.AvailabilityStatus;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentalProductResponse {
    private Long id;
    private String productName;
    private String description;
    private Integer quantity;
    private BigDecimal dailyRate;
    private BigDecimal totalPrice;
    private BigDecimal depositRequired;
    private AvailabilityStatus status;
    private String initialCondition;
    private String returnCondition;
    private String notes;
    private Long productId;
}
