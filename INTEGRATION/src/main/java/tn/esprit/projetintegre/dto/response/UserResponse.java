package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.Role;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private String address;
    private String country;
    private Integer age;
    private Role role;
    private Boolean isSeller;
    private Boolean isBuyer;
    private String storeName;
    private Double sellerRating;
    private String avatar;
    private String bio;
    private Boolean isActive;
    private Integer loyaltyPoints;
    private String loyaltyTier;
    private Integer experiencePoints;
    private Integer level;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
