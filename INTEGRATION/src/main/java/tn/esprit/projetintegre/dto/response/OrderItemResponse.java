package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productThumbnail;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
}
