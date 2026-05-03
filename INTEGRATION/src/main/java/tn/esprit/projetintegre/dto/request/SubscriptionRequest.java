package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {
    @NotBlank(message = "Plan name is required")
    private String planName;
    
    private String planDescription;
    private BigDecimal price;
    private String billingCycle;
    private Integer durationMonths;
    private Boolean autoRenew;
}
