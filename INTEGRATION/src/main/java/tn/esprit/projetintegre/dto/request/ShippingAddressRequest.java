package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ShippingAddressRequest {
    private String label;
    
    @NotBlank(message = "Le nom du destinataire est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String recipientName;
    
    private String phone;
    
    @NotBlank(message = "L'adresse ligne 1 est obligatoire")
    private String addressLine1;
    
    private String addressLine2;
    
    @NotBlank(message = "La ville est obligatoire")
    private String city;
    
    private String state;
    
    @NotBlank(message = "Le code postal est obligatoire")
    private String postalCode;
    
    @NotBlank(message = "Le pays est obligatoire")
    private String country;
    
    private Double latitude;
    private Double longitude;
    private String deliveryInstructions;
    private Boolean isDefault = false;
    
    @NotNull(message = "L'ID utilisateur est obligatoire")
    private Long userId;
}
