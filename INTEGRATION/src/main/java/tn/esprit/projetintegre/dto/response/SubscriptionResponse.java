package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String planName;
    private String planDescription;
    private BigDecimal price;
    private String billingCycle;
    private SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime nextBillingDate;
    private Boolean autoRenew;
    private Boolean isTrial;
    private LocalDateTime trialEndDate;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}
