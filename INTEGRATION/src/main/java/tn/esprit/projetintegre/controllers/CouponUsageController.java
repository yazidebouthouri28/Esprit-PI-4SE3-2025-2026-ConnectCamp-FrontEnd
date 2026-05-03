package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.entities.CouponUsage;
import tn.esprit.projetintegre.repositories.CouponUsageRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/coupon-usages")
@RequiredArgsConstructor
@Tag(name = "Coupon Usages", description = "Coupon usage analytics endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CouponUsageController {

    private final CouponUsageRepository couponUsageRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all coupon usages (Admin only)")
    public ResponseEntity<ApiResponse<List<CouponUsageAdminView>>> getAllCouponUsages() {
        List<CouponUsageAdminView> usages = couponUsageRepository.findAll().stream()
                .map(CouponUsageAdminView::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(usages));
    }

    public record CouponUsageAdminView(
            Long id,
            String couponCode,
            Long userId,
            String userName,
            Long orderId,
            BigDecimal discountAmount,
            LocalDateTime usedAt
    ) {
        public static CouponUsageAdminView fromEntity(CouponUsage usage) {
            return new CouponUsageAdminView(
                    usage.getId(),
                    usage.getCoupon() != null ? usage.getCoupon().getCode() : null,
                    usage.getUser() != null ? usage.getUser().getId() : null,
                    usage.getUser() != null ? usage.getUser().getName() : null,
                    usage.getOrder() != null ? usage.getOrder().getId() : null,
                    usage.getDiscountAmount(),
                    usage.getUsedAt()
            );
        }
    }
}
