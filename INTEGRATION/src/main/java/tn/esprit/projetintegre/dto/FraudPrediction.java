// src/main/java/tn/esprit/projetintegre/dto/FraudPrediction.java

package tn.esprit.projetintegre.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudPrediction {
    private boolean isFraud;
    private double fraudProbability;
    private double normalProbability;
    private String riskLevel;
    private boolean success;

    public static FraudPrediction error() {
        return FraudPrediction.builder()
                .success(false)
                .isFraud(false)
                .riskLevel("UNKNOWN")
                .build();
    }
}