package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String address;
    private String city;
    private String country;
    private String postalCode;
    private String phone;
    private String email;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Integer currentUsage;
    private Boolean isActive;
    private Boolean isPrimary;
    private Long managerId;
    private String managerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
