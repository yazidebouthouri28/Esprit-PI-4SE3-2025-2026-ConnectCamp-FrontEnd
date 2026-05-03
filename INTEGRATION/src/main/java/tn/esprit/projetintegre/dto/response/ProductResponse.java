package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountPercentage;
    private String sku;
    private String barcode;
    private String brand;
    private Long categoryId;
    private String categoryName;
    private Long sellerId;
    private String sellerName;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private List<String> images;
    private String thumbnail;
    private BigDecimal rating;
    private Integer reviewCount;
    private Integer salesCount;
    private Integer viewCount;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isOnSale;
    private Boolean isRentable;
    private BigDecimal rentalPricePerDay;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
