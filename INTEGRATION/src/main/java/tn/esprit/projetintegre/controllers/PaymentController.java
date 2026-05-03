package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.services.PaymentService;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment management APIs")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Pay an order using wallet
     */
    @PostMapping("/order/{orderId}/user/{userId}")
    @Operation(summary = "Pay an order using wallet")
    public ResponseEntity<ApiResponse<String>> payOrder(
            @PathVariable Long orderId,
            @PathVariable Long userId) {

        paymentService.payOrder(orderId, userId);

        return ResponseEntity.ok(
                ApiResponse.success("Payment completed successfully", "OK")
        );
    }
}