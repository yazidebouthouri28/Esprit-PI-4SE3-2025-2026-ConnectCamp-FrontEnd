package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.CampsiteCreateRequest;
import tn.esprit.projetintegre.dto.response.CampsiteResponse;
import tn.esprit.projetintegre.entities.Campsite;
import tn.esprit.projetintegre.services.CampsiteService;

import java.util.List;

@RestController
@RequestMapping("/api/campsites")
@RequiredArgsConstructor
@Tag(name = "Campsites", description = "Campsite management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CampsiteController {

    private final CampsiteService campsiteService;

    @GetMapping
    @Operation(summary = "Get all campsites")
    public ResponseEntity<ApiResponse<List<CampsiteResponse>>> getAll() {
        List<CampsiteResponse> list = campsiteService.getAll().stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Create a campsite (creates site + campsite)")
    public ResponseEntity<ApiResponse<CampsiteResponse>> create(
            @Valid @RequestBody CampsiteCreateRequest request,
            Authentication authentication
    ) {
        Campsite created = campsiteService.create(request, authentication);
        return ResponseEntity.ok(ApiResponse.success("Campsite created successfully", toResponse(created)));
    }

    private CampsiteResponse toResponse(Campsite c) {
        return CampsiteResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .type(c.getType())
                .capacity(c.getCapacity())
                .pricePerNight(c.getPricePerNight())
                .amenities(c.getAmenities())
                .images(c.getImages())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .siteId(c.getSite() != null ? c.getSite().getId() : null)
                .address(c.getSite() != null ? c.getSite().getAddress() : null)
                .city(c.getSite() != null ? c.getSite().getCity() : null)
                .country(c.getSite() != null ? c.getSite().getCountry() : null)
                .build();
    }
}

