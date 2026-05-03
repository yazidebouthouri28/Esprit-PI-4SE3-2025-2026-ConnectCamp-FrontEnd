package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.PackType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackResponse {
    private Long id;
    private String name;
    private String description;
    private PackType packType;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountPercentage;
    private Integer durationDays;
    private Integer maxPersons;
    private String image;
    private List<String> images;
    private List<String> features;
    private List<String> inclusions;
    private List<String> exclusions;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isLimitedOffer;
    private Integer availableQuantity;
    private Integer soldCount;
    private Double rating;
    private Integer reviewCount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Long siteId;
    private String siteName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
