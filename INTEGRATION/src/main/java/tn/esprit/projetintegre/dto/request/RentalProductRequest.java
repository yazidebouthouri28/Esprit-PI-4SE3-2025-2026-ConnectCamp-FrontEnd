package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentalProductRequest {
    @NotBlank(message = "Le nom du produit est obligatoire")
    private String productName;
    
    private String description;
    
    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantity;
    
    @NotNull(message = "Le prix journalier est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif")
    private BigDecimal dailyRate;
    
    private BigDecimal depositRequired;
    private String initialCondition;
    private Long productId;
}
