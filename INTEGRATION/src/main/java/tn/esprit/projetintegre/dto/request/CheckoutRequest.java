package tn.esprit.projetintegre.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    private String shippingAddress;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPhone;
    private String notes;
    private BigDecimal shippingCost;
}