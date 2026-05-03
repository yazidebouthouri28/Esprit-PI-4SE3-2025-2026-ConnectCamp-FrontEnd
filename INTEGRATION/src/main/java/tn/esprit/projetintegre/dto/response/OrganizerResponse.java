package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrganizerResponse {
    private Long id;
    private String companyName;
    private String description;
    private String logo;
    private String banner;
    private String website;
    private String siretNumber;
    private String address;
    private String phone;
    private BigDecimal rating;
    private Integer reviewCount;
    private Integer totalEvents;
    private Boolean verified;
    private Boolean active;
    private Long userId;
    private String userName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
