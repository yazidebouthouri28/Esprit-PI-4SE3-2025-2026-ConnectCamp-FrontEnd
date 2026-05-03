// dto/FinancialSummaryDTO.java
package tn.esprit.projetintegre.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO {
    private Long userId;
    private String userName;
    private BigDecimal totalDeposits;
    private BigDecimal totalPurchases;
    private BigDecimal totalWithdrawals;
    private BigDecimal totalCashback;
    private BigDecimal netChange;
}