package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.CouponRequest;
import tn.esprit.projetintegre.dto.response.CouponResponse;
import tn.esprit.projetintegre.entities.Coupon;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.CouponService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CouponController {

    private final CouponService couponService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all coupons (Admin only)")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAllCoupons() {
        List<Coupon> coupons = couponService.getAllCoupons();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCouponResponseList(coupons)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active coupons")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getActiveCoupons() {
        List<Coupon> coupons = couponService.getActiveCoupons();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCouponResponseList(coupons)));
    }

    @GetMapping("/valid")
    @Operation(summary = "Get valid coupons")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getValidCoupons() {
        List<Coupon> coupons = couponService.getValidCoupons();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCouponResponseList(coupons)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get coupon by ID")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponById(@PathVariable Long id) {
        Coupon coupon = couponService.getCouponById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCouponResponse(coupon)));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get coupon by code")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponByCode(@PathVariable String code) {
        Coupon coupon = couponService.getCouponByCode(code);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCouponResponse(coupon)));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate coupon and calculate discount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal orderAmount) {
        BigDecimal discount = couponService.calculateDiscount(code, orderAmount);
        Map<String, Object> result = Map.of(
                "code", code,
                "discount", discount,
                "finalAmount", orderAmount.subtract(discount)
        );
        return ResponseEntity.ok(ApiResponse.success("Coupon is valid", result));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a coupon (Admin only)")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(@Valid @RequestBody CouponRequest request) {
        Coupon coupon = toEntity(request);
        Coupon created = couponService.createCoupon(coupon);
        return ResponseEntity.ok(ApiResponse.success("Coupon created successfully", dtoMapper.toCouponResponse(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a coupon (Admin only)")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        Coupon couponDetails = toEntity(request);
        Coupon updated = couponService.updateCoupon(id, couponDetails);
        return ResponseEntity.ok(ApiResponse.success("Coupon updated successfully", dtoMapper.toCouponResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a coupon (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted", null));
    }
    private Coupon toEntity(CouponRequest request) {
        return Coupon.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .type(request.getType()) // Corrigé
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount()) // Corrigé
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit()) // Corrigé
                .usageLimitPerUser(request.getUsageLimitPerUser()) // Corrigé
                .isActive(request.getIsActive())
                .isFirstOrderOnly(request.getIsFirstOrderOnly()) // Ajouté
                .validFrom(request.getValidFrom()) // Corrigé
                .validUntil(request.getValidUntil()) // Corrigé
                .build();
    }
}
