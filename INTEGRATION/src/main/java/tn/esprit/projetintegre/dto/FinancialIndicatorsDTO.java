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
public class FinancialIndicatorsDTO {
    private BigDecimal totalRevenue;      // Chiffre d'affaires (achats)
    private BigDecimal totalDeposits;     // Total des dépôts
    private BigDecimal totalWithdrawals;  // Total des retraits
    private BigDecimal totalCashback;     // Total cashback distribué
    private BigDecimal averageCartValue;  // Panier moyen
    private Long totalTransactions;       // Nombre total de transactions
    private Long activeUsers;             // Nombre d'utilisateurs actifs
    private BigDecimal retentionRate;     // Taux de rétention (%)
    private BigDecimal netProfit;         // Bénéfice net
}