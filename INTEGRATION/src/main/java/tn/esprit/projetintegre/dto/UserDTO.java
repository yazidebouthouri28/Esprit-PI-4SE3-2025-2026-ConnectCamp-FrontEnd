package tn.esprit.projetintegre.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.projetintegre.enums.Role;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
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
    private BigDecimal sellerRating;
    private String avatar;
    private String bio;
    private String location;
    private String website;
    private Boolean isActive;
    private Boolean isSuspended;
    private Integer loyaltyPoints;
    private String loyaltyTier;
    private Integer experiencePoints;
    private Integer level;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
