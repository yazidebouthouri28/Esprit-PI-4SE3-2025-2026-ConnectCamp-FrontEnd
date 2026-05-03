package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.PromotionRequest;
import tn.esprit.projetintegre.dto.response.PromotionResponse;
import tn.esprit.projetintegre.entities.Promotion;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.PromotionService;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "Promotion management APIs")
public class PromotionController {

    private final PromotionService promotionService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAllPromotions() {
        List<Promotion> promotions = promotionService.getAllPromotions();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toPromotionResponseList(promotions)));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get all promotions paginated")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getAllPromotionsPaged(Pageable pageable) {
        Page<Promotion> page = promotionService.getAllPromotions(pageable);
        Page<PromotionResponse> response = page.map(dtoMapper::toPromotionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get promotion by ID")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionById(@PathVariable Long id) {
        Promotion promotion = promotionService.getPromotionById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toPromotionResponse(promotion)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActivePromotions() {
        List<Promotion> promotions = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toPromotionResponseList(promotions)));
    }

    @GetMapping("/valid")
    @Operation(summary = "Get currently valid promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getValidPromotions() {
        List<Promotion> promotions = promotionService.getValidPromotions();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toPromotionResponseList(promotions)));
    }

    @PostMapping
    @Operation(summary = "Create a new promotion")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(
            @Valid @RequestBody PromotionRequest request) {
        Promotion promotion = toEntity(request);
        Promotion created = promotionService.createPromotion(promotion);
        return ResponseEntity.ok(ApiResponse.success("Promotion created successfully", dtoMapper.toPromotionResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a promotion")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request) {
        Promotion promotionDetails = toEntity(request);
        Promotion updated = promotionService.updatePromotion(id, promotionDetails);
        return ResponseEntity.ok(ApiResponse.success("Promotion updated successfully", dtoMapper.toPromotionResponse(updated)));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activate a promotion")
    public ResponseEntity<ApiResponse<PromotionResponse>> activatePromotion(@PathVariable Long id) {
        Promotion activated = promotionService.activatePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Promotion activated successfully", dtoMapper.toPromotionResponse(activated)));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a promotion")
    public ResponseEntity<ApiResponse<PromotionResponse>> deactivatePromotion(@PathVariable Long id) {
        Promotion deactivated = promotionService.deactivatePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Promotion deactivated successfully", dtoMapper.toPromotionResponse(deactivated)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a promotion")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Promotion deleted successfully", null));
    }

    private Promotion toEntity(PromotionRequest request) {
        return Promotion.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .discountValue(request.getDiscountValue())
                .minPurchaseAmount(request.getMinPurchaseAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .maxUsage(request.getMaxUsage())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive())
                .targetAudience(request.getTargetAudience())
                .build();
    }
}
