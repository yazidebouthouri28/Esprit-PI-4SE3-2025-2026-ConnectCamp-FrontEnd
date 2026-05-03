package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BecomeSellerRequest {
    @NotBlank(message = "Store name is required")
    private String storeName;
    
    private String storeDescription;
    private String storeLogo;
    private String storeBanner;
}
