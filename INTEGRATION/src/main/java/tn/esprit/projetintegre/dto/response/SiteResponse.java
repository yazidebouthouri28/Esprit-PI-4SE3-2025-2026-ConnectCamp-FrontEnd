package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteResponse {
    private Long id;
    private String name;
    private String description;
    private String type;
    private String address;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private BigDecimal pricePerNight;
    private List<String> images;
    private List<String> amenities;
    private String contactPhone;
    private String contactEmail;
    private Boolean isActive;

    private String checkInTime;
    private String checkOutTime;
    private String houseRules;

    private BigDecimal rating;
    private Integer reviewCount;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
