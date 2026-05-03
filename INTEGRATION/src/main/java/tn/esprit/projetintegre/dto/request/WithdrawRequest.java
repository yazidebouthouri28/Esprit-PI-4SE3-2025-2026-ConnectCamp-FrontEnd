package tn.esprit.projetintegre.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawRequest {
    private BigDecimal amount;
    private String withdrawalChannel;
}