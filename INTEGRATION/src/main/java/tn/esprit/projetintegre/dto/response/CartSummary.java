package tn.esprit.projetintegre.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartSummary {
    private int itemCount;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal total;
}