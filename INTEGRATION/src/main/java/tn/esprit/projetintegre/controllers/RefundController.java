package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.entities.Refund;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.services.RefundService;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@Tag(name = "Refunds", description = "Refund management APIs")
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    @Operation(summary = "Get all refunds paginated")
    public ResponseEntity<ApiResponse<PageResponse<Refund>>> getAllRefunds(Pageable pageable) {
        Page<Refund> page = refundService.getAllRefunds(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get refund by ID")
    public ResponseEntity<ApiResponse<Refund>> getRefundById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getRefundById(id)));
    }

    @GetMapping("/number/{refundNumber}")
    @Operation(summary = "Get refund by number")
    public ResponseEntity<ApiResponse<Refund>> getRefundByNumber(@PathVariable String refundNumber) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getRefundByNumber(refundNumber)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get refunds by user ID")
    public ResponseEntity<ApiResponse<PageResponse<Refund>>> getRefundsByUserId(@PathVariable Long userId, Pageable pageable) {
        Page<Refund> page = refundService.getRefundsByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get refunds by order ID")
    public ResponseEntity<ApiResponse<PageResponse<Refund>>> getRefundsByOrderId(@PathVariable Long orderId, Pageable pageable) {
        Page<Refund> page = refundService.getRefundsByOrderId(orderId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get refunds by status")
    public ResponseEntity<ApiResponse<PageResponse<Refund>>> getRefundsByStatus(@PathVariable PaymentStatus status, Pageable pageable) {
        Page<Refund> page = refundService.getRefundsByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PostMapping
    @Operation(summary = "Create a new refund request")
    public ResponseEntity<ApiResponse<Refund>> createRefund(
            @RequestBody Refund refund,
            @RequestParam Long orderId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Refund request created successfully",
                refundService.createRefund(refund, orderId, userId)));
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Approve a refund")
    public ResponseEntity<ApiResponse<Refund>> approveRefund(
            @PathVariable Long id,
            @RequestParam(required = false) String transactionId) {
        return ResponseEntity.ok(ApiResponse.success("Refund approved successfully",
                refundService.approveRefund(id, transactionId)));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Reject a refund")
    public ResponseEntity<ApiResponse<Refund>> rejectRefund(
            @PathVariable Long id,
            @RequestParam(required = false) String adminNotes) {
        return ResponseEntity.ok(ApiResponse.success("Refund rejected",
                refundService.rejectRefund(id, adminNotes)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a refund")
    public ResponseEntity<ApiResponse<Void>> deleteRefund(@PathVariable Long id) {
        refundService.deleteRefund(id);
        return ResponseEntity.ok(ApiResponse.success("Refund deleted successfully", null));
    }
}
