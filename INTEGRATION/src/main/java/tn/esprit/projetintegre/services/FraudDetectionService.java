package tn.esprit.projetintegre.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.projetintegre.dto.FraudAlert;
import tn.esprit.projetintegre.dto.FraudPrediction;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class FraudDetectionService {

    private static final String PYTHON_API_URL = "http://127.0.0.1:5001/predict";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public FraudPrediction predictFraud(double amount, int hour, String transactionType,
                                        String userProfile, int isStudent, String timezone) {
        try {
            Map<String, Object> inputData = new HashMap<>();
            inputData.put("amount", amount);
            inputData.put("hour", hour);
            inputData.put("transaction_type", transactionType.toUpperCase());
            inputData.put("user_profile", userProfile.toUpperCase());
            inputData.put("is_student", isStudent);
            inputData.put("timezone", timezone != null && !timezone.isBlank() ? timezone : "Africa/Tunis");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(inputData, headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    PYTHON_API_URL, request, JsonNode.class
            );

            JsonNode json = response.getBody();

            if (json == null || json.has("error")) {
                log.error("Python API error: {}", json);
                return failedPrediction();
            }

            FraudPrediction modelPrediction = FraudPrediction.builder()
                    .isFraud(json.get("is_fraud").asBoolean())
                    .fraudProbability(json.get("fraud_probability").asDouble())
                    .normalProbability(json.get("normal_probability").asDouble())
                    .riskLevel(json.get("risk_level").asText())
                    .success(true)
                    .build();

            return applyRuleBasedRisk(modelPrediction, amount, hour, transactionType, userProfile, isStudent);

        } catch (Exception e) {
            log.error("Error during fraud prediction: {}", e.getMessage(), e);
            return applyRuleBasedRisk(failedPrediction(), amount, hour, transactionType, userProfile, isStudent);
        }
    }

    public FraudAlert checkTransaction(double amount, int hour, String transactionType,
                                       String userProfile, int isStudent, String timezone) {
        FraudPrediction prediction = predictFraud(amount, hour, transactionType, userProfile, isStudent, timezone);

        if (!prediction.isSuccess()) {
            return FraudAlert.builder()
                    .alert(false)
                    .message("Fraud detection unavailable")
                    .riskLevel("UNKNOWN")
                    .build();
        }

        if (prediction.isFraud() || prediction.getFraudProbability() > 0.7) {
            return FraudAlert.builder()
                    .alert(true)
                    .fraudProbability(prediction.getFraudProbability())
                    .riskLevel(prediction.getRiskLevel())
                    .message("🚨 HIGH RISK: Transaction flagged as potential fraud!")
                    .build();
        }

        return FraudAlert.builder()
                .alert(false)
                .fraudProbability(prediction.getFraudProbability())
                .riskLevel(prediction.getRiskLevel())
                .message("✅ Transaction appears normal")
                .build();
    }

    private FraudPrediction failedPrediction() {
        return FraudPrediction.builder()
                .success(false)
                .isFraud(false)
                .riskLevel("UNKNOWN")
                .build();
    }

    private FraudPrediction applyRuleBasedRisk(FraudPrediction prediction, double amount, int hour,
                                               String transactionType, String userProfile, int isStudent) {
        double ruleProbability = calculateRuleProbability(amount, hour, transactionType, userProfile, isStudent);
        double modelProbability = prediction.getFraudProbability();
        double fraudProbability = Math.max(modelProbability, ruleProbability);
        String riskLevel = resolveRiskLevel(fraudProbability);

        return FraudPrediction.builder()
                .success(true)
                .isFraud(fraudProbability >= 0.70)
                .fraudProbability(round(fraudProbability))
                .normalProbability(round(1.0 - fraudProbability))
                .riskLevel(riskLevel)
                .build();
    }

    private double calculateRuleProbability(double amount, int hour, String transactionType,
                                            String userProfile, int isStudent) {
        double probability = 0.08;

        if (amount >= 1000) {
            probability += 0.62;
        } else if (amount >= 700) {
            probability += 0.50;
        } else if (amount >= 300) {
            probability += 0.28;
        } else if (amount >= 150) {
            probability += 0.12;
        }

        if (hour < 6 || hour >= 23) {
            probability += 0.15;
        }

        String type = transactionType != null ? transactionType.toUpperCase() : "";
        if ("TRANSFER".equals(type) || "WITHDRAWAL".equals(type)) {
            probability += 0.10;
        }

        String profile = userProfile != null ? userProfile.toUpperCase() : "";
        if ("ECONOMICAL".equals(profile) && amount >= 300) {
            probability += 0.08;
        }
        if ("PREMIUM".equals(profile) && amount < 700) {
            probability -= 0.05;
        }
        if (isStudent == 1 && amount >= 300) {
            probability += 0.05;
        }

        return Math.max(0.02, Math.min(0.95, probability));
    }

    private String resolveRiskLevel(double fraudProbability) {
        if (fraudProbability >= 0.70) {
            return "HIGH";
        }
        if (fraudProbability >= 0.30) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private double round(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }
}
