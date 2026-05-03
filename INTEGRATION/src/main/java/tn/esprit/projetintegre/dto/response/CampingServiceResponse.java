package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.ServiceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampingServiceResponse {
    private Long id;
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
    private BigDecimal rating;
    private Integer reviewCount;
    private Long providerId;
    private String providerName;
    private Long siteId;
    private String siteName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
