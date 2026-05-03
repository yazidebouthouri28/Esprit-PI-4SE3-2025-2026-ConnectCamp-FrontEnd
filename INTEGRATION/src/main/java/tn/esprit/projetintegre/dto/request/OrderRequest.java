package tn.esprit.projetintegre.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    private String shippingAddress;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPostalCode;
    private String shippingPhone;
    private String billingAddress;
    private String notes;
    private String couponCode;
    private String paymentMethod;
}
