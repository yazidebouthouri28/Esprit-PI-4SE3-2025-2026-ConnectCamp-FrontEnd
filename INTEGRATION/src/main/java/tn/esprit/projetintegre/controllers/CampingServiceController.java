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
import tn.esprit.projetintegre.dto.request.CampingServiceRequest;
import tn.esprit.projetintegre.dto.response.CampingServiceResponse;
import tn.esprit.projetintegre.entities.CampingService;
import tn.esprit.projetintegre.enums.ServiceType;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.CampingServiceService;

import java.util.List;

@RestController
@RequestMapping("/api/camping-services")
@RequiredArgsConstructor
@Tag(name = "Camping Services", description = "Camping service management APIs")
public class CampingServiceController {

    private final CampingServiceService campingServiceService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all camping services paginated")
    public ResponseEntity<ApiResponse<PageResponse<CampingServiceResponse>>> getAllServices(Pageable pageable) {
        Page<CampingService> page = campingServiceService.getAllServices(pageable);
        Page<CampingServiceResponse> response = page.map(dtoMapper::toCampingServiceResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get camping service by ID")
    public ResponseEntity<ApiResponse<CampingServiceResponse>> getServiceById(@PathVariable Long id) {
        CampingService service = campingServiceService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCampingServiceResponse(service)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active camping services")
    public ResponseEntity<ApiResponse<PageResponse<CampingServiceResponse>>> getActiveServices(Pageable pageable) {
        Page<CampingService> page = campingServiceService.getActiveServices(pageable);
        Page<CampingServiceResponse> response = page.map(dtoMapper::toCampingServiceResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get camping services by type")
    public ResponseEntity<ApiResponse<List<CampingServiceResponse>>> getServicesByType(@PathVariable ServiceType type) {
        List<CampingService> services = campingServiceService.getServicesByType(type);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCampingServiceResponseList(services)));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Get camping services by site ID")
    public ResponseEntity<ApiResponse<PageResponse<CampingServiceResponse>>> getServicesBySiteId(
            @PathVariable Long siteId, Pageable pageable) {
        Page<CampingService> page = campingServiceService.getServicesBySiteId(siteId, pageable);
        Page<CampingServiceResponse> response = page.map(dtoMapper::toCampingServiceResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get camping services by provider ID")
    public ResponseEntity<ApiResponse<PageResponse<CampingServiceResponse>>> getServicesByProviderId(
            @PathVariable Long providerId, Pageable pageable) {
        Page<CampingService> page = campingServiceService.getServicesByProviderId(providerId, pageable);
        Page<CampingServiceResponse> response = page.map(dtoMapper::toCampingServiceResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @PostMapping
    @Operation(summary = "Create a new camping service")
    public ResponseEntity<ApiResponse<CampingServiceResponse>> createService(
            @Valid @RequestBody CampingServiceRequest request,
            @RequestParam Long providerId,
            @RequestParam(required = false) Long siteId) {
        CampingService service = toEntity(request);
        CampingService created = campingServiceService.createService(service, providerId, siteId);
        return ResponseEntity.ok(ApiResponse.success("Camping service created successfully", dtoMapper.toCampingServiceResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a camping service")
    public ResponseEntity<ApiResponse<CampingServiceResponse>> updateService(
            @PathVariable Long id,
            @Valid @RequestBody CampingServiceRequest request) {
        CampingService serviceDetails = toEntity(request);
        CampingService updated = campingServiceService.updateService(id, serviceDetails);
        return ResponseEntity.ok(ApiResponse.success("Camping service updated successfully", dtoMapper.toCampingServiceResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a camping service")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable Long id) {
        campingServiceService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.success("Camping service deleted successfully", null));
    }

    private CampingService toEntity(CampingServiceRequest request) {
        return CampingService.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .price(request.getPrice())
                .pricingUnit(request.getPricingUnit())
                .images(request.getImages())
                .isActive(request.getIsActive())
                .isAvailable(request.getIsAvailable())
                .maxCapacity(request.getMaxCapacity())
                .duration(request.getDuration())
                .build();
    }
}
