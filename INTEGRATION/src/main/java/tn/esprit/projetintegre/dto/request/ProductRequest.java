package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    
    @NotBlank(message = "Le nom du produit est obligatoire")
    @Size(min = 2, max = 200, message = "Le nom doit contenir entre 2 et 200 caractères")
    private String name;
    
    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;
    
    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
    @DecimalMax(value = "9999999.99", message = "Le prix ne peut pas dépasser 9 999 999,99")
    private BigDecimal price;
    
    @DecimalMin(value = "0.00", message = "Le prix original ne peut pas être négatif")
    private BigDecimal originalPrice;
    
    @DecimalMin(value = "0.00", message = "Le pourcentage de réduction ne peut pas être négatif")
    @DecimalMax(value = "100.00", message = "Le pourcentage de réduction ne peut pas dépasser 100%")
    private BigDecimal discountPercentage;
    
    @Size(max = 50, message = "Le SKU ne peut pas dépasser 50 caractères")
    private String sku;
    
    @Size(max = 50, message = "Le code-barres ne peut pas dépasser 50 caractères")
    private String barcode;
    
    @Size(max = 100, message = "La marque ne peut pas dépasser 100 caractères")
    private String brand;
    
    private Long categoryId;
    
    @NotNull(message = "L'identifiant du vendeur est obligatoire")
    private Long sellerId;
    
    @Min(value = 0, message = "La quantité en stock ne peut pas être négative")
    private Integer stockQuantity;
    
    @Min(value = 0, message = "Le niveau de stock minimum ne peut pas être négatif")
    private Integer minStockLevel;
    
    @Min(value = 1, message = "Le niveau de stock maximum doit être au moins 1")
    private Integer maxStockLevel;
    
    private Boolean trackInventory;
    
    @Size(max = 20, message = "Maximum 20 images autorisées")
    private List<String> images;
    
    @Size(max = 500, message = "L'URL de la miniature ne peut pas dépasser 500 caractères")
    private String thumbnail;
    
    private Boolean isFeatured;
    private Boolean isOnSale;
    private Boolean isRentable;
    
    @DecimalMin(value = "0.00", message = "Le prix de location ne peut pas être négatif")
    private BigDecimal rentalPricePerDay;
    
    @DecimalMin(value = "0.00", message = "Le poids ne peut pas être négatif")
    private Double weight;
    
    @Size(max = 100, message = "Les dimensions ne peuvent pas dépasser 100 caractères")
    private String dimensions;
    
    private List<String> tags;
}
