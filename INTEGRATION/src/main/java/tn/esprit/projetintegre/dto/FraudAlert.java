// src/main/java/tn/esprit/projetintegre/dto/FraudAlert.java

package tn.esprit.projetintegre.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudAlert {
    private boolean alert;
    private double fraudProbability;
    private String riskLevel;
    private String message;
}