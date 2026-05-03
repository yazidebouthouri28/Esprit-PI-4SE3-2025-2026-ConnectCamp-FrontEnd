package tn.esprit.projetintegre.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSummaryResponse {
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
    private String image;
    private List<String> amenities;
    private Boolean isActive;
    private Boolean verified;
    private BigDecimal rating;
    private Integer reviewCount;
    private String checkInTime;
    private String checkOutTime;
    private String houseRules;
}
