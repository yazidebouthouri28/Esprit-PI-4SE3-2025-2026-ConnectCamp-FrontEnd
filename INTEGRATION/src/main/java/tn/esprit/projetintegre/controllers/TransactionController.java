package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.*;
import tn.esprit.projetintegre.dto.request.TransactionRequest;
import tn.esprit.projetintegre.dto.response.TransactionResponse;
import tn.esprit.projetintegre.entities.Alert;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.AlertService;
import tn.esprit.projetintegre.services.FraudDetectionService;
import tn.esprit.projetintegre.services.TransactionService;
import tn.esprit.projetintegre.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transaction management APIs")
public class TransactionController {

    private final TransactionService transactionService;
    private final DtoMapper dtoMapper;
    private final UserService userService;
    private final FraudDetectionService fraudDetectionService;
    private final AlertService alertService;



    @PostMapping
    @Operation(summary = "Create a new transaction (PENDING)")
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @RequestBody TransactionRequest request,
            @RequestParam Long walletId) {

        Transaction transaction = dtoMapper.toTransaction(request);

        Transaction saved = transactionService.createTransaction(transaction, walletId);

        return ResponseEntity.ok(
                ApiResponse.success(dtoMapper.toTransactionResponse(saved))
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel a transaction (only if PENDING)")
    public ResponseEntity<ApiResponse<String>> deleteTransaction(@PathVariable Long id) {

        transactionService.deleteTransaction(id);

        return ResponseEntity.ok(
                ApiResponse.success("Transaction cancelled successfully")
        );
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm a transaction manually")
    public ResponseEntity<ApiResponse<TransactionResponse>> confirmTransaction(
            @PathVariable Long id) {

        Transaction transaction = transactionService.confirmTransaction(id);

        return ResponseEntity.ok(
                ApiResponse.success(dtoMapper.toTransactionResponse(transaction))
        );
    }


    //filtrer le pending
    @GetMapping("/status/{status}")
    @Operation(summary = "Get transactions by status")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getByStatus(
            @PathVariable String status,
            Pageable pageable) {

        Page<Transaction> page =
                transactionService.getTransactionsByStatus(status, pageable);

        Page<TransactionResponse> response = page.map(dtoMapper::toTransactionResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }
    @GetMapping
    @Operation(summary = "Get all transactions paginated")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getAllTransactions(Pageable pageable) {
        Page<Transaction> page = transactionService.getAllTransactions(pageable);
        Page<TransactionResponse> response = page.map(dtoMapper::toTransactionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionService.getTransactionById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toTransactionResponse(transaction)));
    }

    @GetMapping("/number/{transactionNumber}")
    @Operation(summary = "Get transaction by number")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionByNumber(@PathVariable String transactionNumber) {
        Transaction transaction = transactionService.getTransactionByNumber(transactionNumber);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toTransactionResponse(transaction)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get transactions by user ID")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getTransactionsByUserId(
            @PathVariable Long userId, Pageable pageable) {
        Page<Transaction> page = transactionService.getTransactionsByUserId(userId, pageable);
        Page<TransactionResponse> response = page.map(dtoMapper::toTransactionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/wallet/{walletId}")
    @Operation(summary = "Get transactions by wallet ID")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getTransactionsByWalletId(
            @PathVariable Long walletId, Pageable pageable) {
        Page<Transaction> page = transactionService.getTransactionsByWalletId(walletId, pageable);
        Page<TransactionResponse> response = page.map(dtoMapper::toTransactionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get transactions by type")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getTransactionsByType(
            @PathVariable TransactionType type,
            Pageable pageable) {
        Page<Transaction> page = transactionService.getTransactionsByType(type, pageable);
        Page<TransactionResponse> response = page.map(dtoMapper::toTransactionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/financial-summary")
    @Operation(summary = "Get financial summary per user")
    public ResponseEntity<ApiResponse<List<FinancialSummaryDTO>>> getFinancialSummary() {
        List<FinancialSummaryDTO> summary = transactionService.getUserFinancialSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/financial-indicators")
    @Operation(summary = "Get global financial indicators")
    public ResponseEntity<ApiResponse<FinancialIndicatorsDTO>> getFinancialIndicators() {
        FinancialIndicatorsDTO indicators = transactionService.getFinancialIndicators();
        return ResponseEntity.ok(ApiResponse.success(indicators));
    }

    // ==================== MACHINE LEARNING ENDPOINTS ====================

    private static final List<String> VALID_TYPES = List.of(
            "BILLS", "ENTERTAINMENT", "GROCERIES", "RESTAURANT", "SHOPPING", "TRAVEL"
    );

    private static final List<String> VALID_PROFILES = List.of(
            "ECONOMICAL", "NORMAL", "PREMIUM"
    );

    @PostMapping("/check-fraud")
    @Operation(summary = "Check if a transaction is fraudulent")
    public ResponseEntity<ApiResponse<FraudAlert>> checkFraud(
            @RequestParam double amount,
            @RequestParam int hour,
            @RequestParam String transactionType,
            @RequestParam String userProfile,
            @RequestParam int isStudent,
            @RequestParam(defaultValue = "UTC+1") String timezone,
            @RequestParam(required = false) Long reportedById) {

        String type = transactionType.toUpperCase();
        String profile = userProfile.toUpperCase();

        if (!VALID_TYPES.contains(type)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid transactionType. Allowed values: " + VALID_TYPES)
            );
        }
        if (!VALID_PROFILES.contains(profile)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid userProfile. Allowed values: " + VALID_PROFILES)
            );
        }

        FraudAlert alert = fraudDetectionService.checkTransaction(
                amount, hour, type, profile, isStudent, timezone
        );

        if (alert.isAlert() && reportedById != null) {
            Alert adminAlert = Alert.builder()
                    .title("Suspicious client transaction")
                    .description(String.format(
                            "Client fraud alert generated during checkout.%nAmount: %.2f DT%nHour: %02d:00%nTransaction type: %s%nUser profile: %s%nStudent: %s%nTimezone: %s%nFraud probability: %.2f%%%nRisk level: %s%nMessage: %s",
                            amount,
                            hour,
                            type,
                            profile,
                            isStudent == 1 ? "YES" : "NO",
                            timezone,
                            alert.getFraudProbability() * 100,
                            alert.getRiskLevel(),
                            alert.getMessage()
                    ))
                    .alertType("FRAUD")
                    .severity("CRITICAL")
                    .location("Checkout")
                    .notificationSent(false)
                    .build();
            alertService.createAlert(adminAlert, reportedById, null);
        }

        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @PostMapping("/predict-fraud")
    @Operation(summary = "Get detailed fraud prediction (probability score)")
    public ResponseEntity<ApiResponse<FraudPrediction>> predictFraud(
            @RequestParam double amount,
            @RequestParam int hour,
            @RequestParam String transactionType,
            @RequestParam String userProfile,
            @RequestParam int isStudent,
            @RequestParam(defaultValue = "UTC+1") String timezone) {

        String type = transactionType.toUpperCase();
        String profile = userProfile.toUpperCase();

        if (!VALID_TYPES.contains(type)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid transactionType. Allowed values: " + VALID_TYPES)
            );
        }

        if (!VALID_PROFILES.contains(profile)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid userProfile. Allowed values: " + VALID_PROFILES)
            );
        }

        FraudPrediction prediction = fraudDetectionService.predictFraud(
                amount, hour, type, profile, isStudent, timezone
        );

        return ResponseEntity.ok(ApiResponse.success(prediction));
    }
}
