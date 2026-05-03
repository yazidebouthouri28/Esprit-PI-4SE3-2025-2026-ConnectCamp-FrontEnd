package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryResponse {
    private Long id;
    private String sku;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer lowStockThreshold;
    private Integer safetyStock;
    private Integer reorderQuantity;
    private String location;
    private String aisle;
    private String shelf;
    private String bin;
    private LocalDateTime lastStockCheck;
    private LocalDateTime lastRestocked;
    private Long productId;
    private String productName;
    private Long variantId;
    private String variantName;
    private Long warehouseId;
    private String warehouseName;
    private Boolean isLowStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
