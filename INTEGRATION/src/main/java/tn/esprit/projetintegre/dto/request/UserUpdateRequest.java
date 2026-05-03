package tn.esprit.projetintegre.dto.request;

import lombok.*;
import tn.esprit.projetintegre.enums.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String name;
    private String phone;
    private String address;
    private String country;
    private Integer age;
    private String avatar;
    private String bio;
    private Role role;
    
    // Seller fields
    private String storeName;
    private String storeDescription;
    private String storeLogo;
    private String storeBanner;
}
