package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseRequest {
    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 20, message = "Le code ne peut pas dépasser 20 caractères")
    private String code;
    
    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String name;
    
    private String description;
    
    @NotBlank(message = "L'adresse est obligatoire")
    private String address;
    
    private String city;
    private String country;
    private String postalCode;
    private String phone;
    @Email(message = "L'email doit être valide")
    private String email;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Boolean isPrimary;
    private Long managerId;
}
