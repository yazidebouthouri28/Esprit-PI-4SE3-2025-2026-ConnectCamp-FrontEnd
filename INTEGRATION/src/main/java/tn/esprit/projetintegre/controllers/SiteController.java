package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.SiteRequest;
import tn.esprit.projetintegre.dto.response.SiteResponse;
import tn.esprit.projetintegre.dto.response.SiteSummaryResponse;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.services.SiteService;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
@Tag(name = "Sites", description = "Site/Location management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class SiteController {

    private final SiteService siteService;
    private final DtoMapper dtoMapper;
    private final SiteModuleMapper siteModuleMapper;

    @GetMapping
    @Operation(summary = "Get all active sites")
    public ResponseEntity<ApiResponse<PageResponse<SiteResponse>>> getAllSites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Site> sites = siteService.getActiveSites(PageRequest.of(page, size));
        Page<SiteResponse> response = sites.map(dtoMapper::toSiteResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all sites (Admin only)")
    public ResponseEntity<ApiResponse<List<SiteResponse>>> getAllSitesAdmin() {
        List<Site> sites = siteService.getAllSitesAdmin();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSiteResponseList(sites)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get active site summaries")
    public ResponseEntity<ApiResponse<List<SiteSummaryResponse>>> getSiteSummaries() {
        List<Site> sites = siteService.getActiveSites();
        return ResponseEntity.ok(ApiResponse.success(siteModuleMapper.toSiteSummaryResponseList(sites)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get site by ID")
    public ResponseEntity<ApiResponse<SiteResponse>> getSiteById(@PathVariable Long id) {
        Site site = siteService.getSiteById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSiteResponse(site)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search sites")
    public ResponseEntity<ApiResponse<PageResponse<SiteResponse>>> searchSites(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Site> sites = siteService.searchSites(keyword, PageRequest.of(page, size));
        Page<SiteResponse> response = sites.map(dtoMapper::toSiteResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/city/{city}")
    @Operation(summary = "Get sites by city")
    public ResponseEntity<ApiResponse<List<SiteResponse>>> getSitesByCity(@PathVariable String city) {
        List<Site> sites = siteService.getSitesByCity(city);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSiteResponseList(sites)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get sites by type")
    public ResponseEntity<ApiResponse<List<SiteResponse>>> getSitesByType(@PathVariable String type) {
        List<Site> sites = siteService.getSitesByType(type);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSiteResponseList(sites)));
    }

    @GetMapping("/owner/{ownerId}")
    @Operation(summary = "Get sites by owner")
    public ResponseEntity<ApiResponse<PageResponse<SiteResponse>>> getSitesByOwner(
            @PathVariable Long ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Site> sites = siteService.getSitesByOwner(ownerId, PageRequest.of(page, size));
        Page<SiteResponse> response = sites.map(dtoMapper::toSiteResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Create a site")
    public ResponseEntity<ApiResponse<SiteResponse>> createSite(
            @Valid @RequestBody SiteRequest request) {
        Site site = toEntity(request);
        Site created = siteService.createSite(site, request.getOwnerId());
        return ResponseEntity.ok(ApiResponse.success("Site created successfully", dtoMapper.toSiteResponse(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Update a site")
    public ResponseEntity<ApiResponse<SiteResponse>> updateSite(
            @PathVariable Long id,
            @Valid @RequestBody SiteRequest request) {
        Site siteDetails = toEntity(request);
        Site updated = siteService.updateSite(id, siteDetails);
        return ResponseEntity.ok(ApiResponse.success("Site updated successfully", dtoMapper.toSiteResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Delete a site")
    public ResponseEntity<ApiResponse<Void>> deleteSite(@PathVariable Long id) {
        siteService.deleteSite(id);
        return ResponseEntity.ok(ApiResponse.success("Site deleted", null));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Upload images for a site")
    public ResponseEntity<ApiResponse<SiteResponse>> uploadSiteImages(
            @PathVariable Long id,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("At least one image file is required (field name: files)"));
        }
        List<MultipartFile> list = Arrays.stream(files)
                .filter(f -> f != null && !f.isEmpty())
                .collect(Collectors.toList());
        if (list.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("At least one non-empty image file is required"));
        }
        Site updated = siteService.appendSiteImages(id, list);
        return ResponseEntity.ok(ApiResponse.success("Images uploaded", dtoMapper.toSiteResponse(updated)));
    }

    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Remove a site image by URL")
    public ResponseEntity<ApiResponse<SiteResponse>> removeSiteImage(
            @PathVariable Long id,
            @RequestParam String url) {
        Site updated = siteService.removeSiteImageByUrl(id, url);
        return ResponseEntity.ok(ApiResponse.success("Image removed", dtoMapper.toSiteResponse(updated)));
    }

    private Site toEntity(SiteRequest request) {
        return Site.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .capacity(request.getCapacity())
                .pricePerNight(request.getPricePerNight())
                .images(request.getImages())
                .amenities(request.getAmenities())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }
}
