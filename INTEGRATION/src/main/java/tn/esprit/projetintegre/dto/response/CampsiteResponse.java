package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampsiteResponse {
    private Long id;
    private String name;
    private String description;
    private String type;
    private Integer capacity;
    private BigDecimal pricePerNight;
    private List<String> amenities;
    private List<String> images;
    private Double latitude;
    private Double longitude;
    private Long siteId;
    private String address;
    private String city;
    private String country;
}

