package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.projetintegre.enums.ServiceType;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampingServiceRequest {
    @NotBlank(message = "Service name is required")
    private String name;
    
    private String description;
    private ServiceType type;
    private BigDecimal price;
    private String pricingUnit;
    private List<String> images;
    private Boolean isActive;
    private Boolean isAvailable;
    private Integer maxCapacity;
    private Integer duration;
    private Long providerId;
    private Long siteId;
}
