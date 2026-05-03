package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private Long id;
    private Long userId;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private Integer totalItems;
    private LocalDateTime updatedAt;
    private String appliedCouponCode;
    private Long appliedPromotionId;
    private String appliedPromotionName;
}
