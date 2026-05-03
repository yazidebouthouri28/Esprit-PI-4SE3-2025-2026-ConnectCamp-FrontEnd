package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryRequest {
    @NotBlank(message = "Le SKU est obligatoire")
    private String sku;
    
    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 0, message = "La quantité doit être positive")
    private Integer quantity;

    @Min(value = 0, message = "La quantité réservée doit être positive")
    private Integer reservedQuantity;
    
    private Integer lowStockThreshold = 10;
    private Integer safetyStock = 5;
    private Integer reorderQuantity;
    private String location;
    private String aisle;
    private String shelf;
    private String bin;
    
    @NotNull(message = "L'ID du produit est obligatoire")
    private Long productId;
    
    private Long variantId;
    
    @NotNull(message = "L'ID de l'entrepôt est obligatoire")
    private Long warehouseId;
}
