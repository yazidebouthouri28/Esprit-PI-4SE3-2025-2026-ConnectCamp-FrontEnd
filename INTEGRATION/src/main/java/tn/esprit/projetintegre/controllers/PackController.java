package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PackDTO;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.enums.PackType;
import tn.esprit.projetintegre.services.PackService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/packs")
@RequiredArgsConstructor
@Tag(name = "Packs", description = "API pour la gestion des packs de services")
public class PackController {

    private final PackService packService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un pack")
    public ResponseEntity<ApiResponse<PackDTO.Response>> createPack(
            @Valid @RequestBody PackDTO.CreateRequest request) {
        PackDTO.Response response = packService.createPack(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pack créé avec succès", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un pack par ID")
    public ResponseEntity<ApiResponse<PackDTO.Response>> getById(@PathVariable Long id) {
        PackDTO.Response response = packService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Obtenir tous les packs actifs")
    public ResponseEntity<ApiResponse<PageResponse<PackDTO.Response>>> getAllActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = PageRequest.of(page, size,
                sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending());
        var result = packService.getAllActive(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Obtenir les packs par type")
    public ResponseEntity<ApiResponse<PageResponse<PackDTO.Response>>> getByType(
            @PathVariable PackType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var result = packService.getByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Obtenir les packs d'un site")
    public ResponseEntity<ApiResponse<PageResponse<PackDTO.Response>>> getBySiteId(
            @PathVariable Long siteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var result = packService.getBySiteId(siteId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/featured")
    @Operation(summary = "Obtenir les packs en vedette")
    public ResponseEntity<ApiResponse<List<PackDTO.Response>>> getFeaturedPacks() {
        List<PackDTO.Response> response = packService.getFeaturedPacks();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/top-selling")
    @Operation(summary = "Obtenir les packs les plus vendus")
    public ResponseEntity<ApiResponse<List<PackDTO.Response>>> getTopSellingPacks(
            @RequestParam(defaultValue = "10") int limit) {
        List<PackDTO.Response> response = packService.getTopSellingPacks(limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des packs")
    public ResponseEntity<ApiResponse<PageResponse<PackDTO.Response>>> searchPacks(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var result = packService.searchPacks(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/price-range")
    @Operation(summary = "Obtenir les packs par plage de prix")
    public ResponseEntity<ApiResponse<PageResponse<PackDTO.Response>>> getByPriceRange(
            @RequestParam BigDecimal minPrice,
            @RequestParam BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("price").ascending());
        var result = packService.getByPriceRange(minPrice, maxPrice, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour un pack")
    public ResponseEntity<ApiResponse<PackDTO.Response>> updatePack(
            @PathVariable Long id,
            @Valid @RequestBody PackDTO.UpdateRequest request) {
        PackDTO.Response response = packService.updatePack(id, request);
        return ResponseEntity.ok(ApiResponse.success("Pack mis à jour avec succès", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un pack")
    public ResponseEntity<ApiResponse<Void>> deletePack(@PathVariable Long id) {
        packService.deletePack(id);
        return ResponseEntity.ok(ApiResponse.success("Pack supprimé avec succès", null));
    }
}
