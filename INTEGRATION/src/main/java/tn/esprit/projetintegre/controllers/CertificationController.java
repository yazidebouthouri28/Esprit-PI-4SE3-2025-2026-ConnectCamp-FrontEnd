package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.CertificationRequest;
import tn.esprit.projetintegre.dto.response.CertificationResponse;
import tn.esprit.projetintegre.enums.CertificationStatus;
import tn.esprit.projetintegre.services.CertificationService;

import java.util.List;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
@Tag(name = "Certifications", description = "Gestion des certifications")
public class CertificationController {

    private final CertificationService certificationService;

    @GetMapping
    @Operation(summary = "Liste toutes les certifications")
    public ResponseEntity<ApiResponse<List<CertificationResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(certificationService.getAll()));
    }

    @GetMapping("/paginated")
    @Operation(summary = "Liste paginée des certifications")
    public ResponseEntity<ApiResponse<PageResponse<CertificationResponse>>> getAllPaginated(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(certificationService.getAllPaginated(pageable))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère une certification par ID")
    public ResponseEntity<ApiResponse<CertificationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(certificationService.getById(id)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Liste les certifications d'un utilisateur")
    public ResponseEntity<ApiResponse<List<CertificationResponse>>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(certificationService.getByUserId(userId)));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Liste les certifications d'un site")
    public ResponseEntity<ApiResponse<List<CertificationResponse>>> getBySiteId(@PathVariable Long siteId) {
        return ResponseEntity.ok(ApiResponse.success(certificationService.getBySiteId(siteId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Crée une nouvelle certification")
    public ResponseEntity<ApiResponse<CertificationResponse>> create(@Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certification créée avec succès", certificationService.create(request)));
    }

    @PostMapping("/site/{siteId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Crée une nouvelle certification pour un site")
    public ResponseEntity<ApiResponse<CertificationResponse>> createForSite(@PathVariable Long siteId, @Valid @RequestBody CertificationRequest request) {
        request.setSiteId(siteId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certification créée avec succès", certificationService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Met à jour une certification")
    public ResponseEntity<ApiResponse<CertificationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Certification mise à jour", certificationService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Met à jour le statut d'une certification")
    public ResponseEntity<ApiResponse<CertificationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam CertificationStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Statut mis à jour", certificationService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprime une certification")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        certificationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Certification supprimée", null));
    }
}
