package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.WithdrawRequest;
import tn.esprit.projetintegre.dto.response.WalletResponse;
import tn.esprit.projetintegre.entities.Wallet;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.WalletService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "Wallet management APIs")
public class WalletController {

    private final WalletService walletService;
    private final DtoMapper dtoMapper;


    @GetMapping
    @Operation(summary = "Get all wallets")
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getAllWallets() {
        List<Wallet> wallets = walletService.getAllWallets();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toWalletResponseList(wallets)));
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money between two users")
    public ResponseEntity<ApiResponse<Void>> transferFunds(
            @RequestParam Long senderUserId,
            @RequestParam Long receiverUserId,
            @RequestParam BigDecimal amount) {

        walletService.transferFunds(senderUserId, receiverUserId, amount);

        return ResponseEntity.ok(
                ApiResponse.success("Transfer completed successfully", null)
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get wallet by ID")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletById(@PathVariable Long id) {
        Wallet wallet = walletService.getWalletById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toWalletResponse(wallet)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get wallet by user ID")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletByUserId(@PathVariable Long userId) {
        Wallet wallet = walletService.getWalletByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toWalletResponse(wallet)));
    }

    @GetMapping("/user/{userId}/balance")
    @Operation(summary = "Get wallet balance by user ID")
    public ResponseEntity<ApiResponse<BigDecimal>> getBalance(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getBalance(userId)));
    }

    @PostMapping("/user/{userId}/add-funds")
    @Operation(summary = "Add funds to wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> addFunds(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount) {
        Wallet wallet = walletService.addFunds(userId, amount);
        return ResponseEntity.ok(ApiResponse.success("Funds added successfully", dtoMapper.toWalletResponse(wallet)));
    }

    @PostMapping("/user/{userId}/deduct-funds")
    @Operation(summary = "Deduct funds from wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> deductFunds(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount) {
        Wallet wallet = walletService.deductFunds(userId, amount);
        return ResponseEntity.ok(ApiResponse.success("Funds deducted successfully", dtoMapper.toWalletResponse(wallet)));
    }

    @PutMapping("/user/{userId}/deactivate")
    @Operation(summary = "Deactivate wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> deactivateWallet(@PathVariable Long userId) {
        Wallet wallet = walletService.deactivateWallet(userId);
        return ResponseEntity.ok(ApiResponse.success("Wallet deactivated successfully", dtoMapper.toWalletResponse(wallet)));
    }

    @PutMapping("/user/{userId}/activate")
    @Operation(summary = "Activate wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> activateWallet(@PathVariable Long userId) {
        Wallet wallet = walletService.activateWallet(userId);
        return ResponseEntity.ok(ApiResponse.success("Wallet activated successfully", dtoMapper.toWalletResponse(wallet)));
    }

    @PostMapping("/user/{userId}")
    @Operation(summary = "Create a wallet for a user")
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(@PathVariable Long userId) {
        try {
            Wallet wallet = walletService.createWallet(userId);
            return new ResponseEntity<>(
                    ApiResponse.success("Wallet created successfully", dtoMapper.toWalletResponse(wallet)),
                    HttpStatus.CREATED
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete wallet by ID (balance must be zero)")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(@PathVariable Long id) {
        try {
            walletService.deleteWallet(id);
            return ResponseEntity.ok(ApiResponse.success("Wallet deleted successfully", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userId}")
    @Operation(summary = "Delete wallet by user ID (balance must be zero)")
    public ResponseEntity<ApiResponse<Void>> deleteWalletByUserId(@PathVariable Long userId) {
        try {
            walletService.deleteWalletByUserId(userId);
            return ResponseEntity.ok(ApiResponse.success("Wallet deleted successfully", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/user/{userId}/withdraw")
    @Operation(summary = "Withdraw funds from wallet")
    public ResponseEntity<ApiResponse<Wallet>> withdrawFunds(
            @PathVariable Long userId,
            @RequestBody WithdrawRequest request) {
        Wallet wallet = walletService.withdrawFunds(userId, request.getAmount(), request.getWithdrawalChannel());
        return ResponseEntity.ok(ApiResponse.success("Withdrawal request submitted successfully", wallet));
    }

}
