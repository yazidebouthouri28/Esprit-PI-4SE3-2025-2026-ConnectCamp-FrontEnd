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
import tn.esprit.projetintegre.dto.EmergencyAlertDTO;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.services.EmergencyAlertService;

import java.util.List;

@RestController
@RequestMapping("/api/emergency-alerts")
@RequiredArgsConstructor
@Tag(name = "Alertes d'Urgence", description = "API pour la gestion des alertes d'urgence")
public class EmergencyAlertController {

    private final EmergencyAlertService alertService;

    @PostMapping
    @Operation(summary = "Créer une alerte d'urgence")
    public ResponseEntity<ApiResponse<EmergencyAlertDTO.Response>> createAlert(
            @RequestParam Long reporterId,
            @Valid @RequestBody EmergencyAlertDTO.CreateRequest request) {
        EmergencyAlertDTO.Response response = alertService.createAlert(reporterId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Alerte d'urgence créée avec succès", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir une alerte par ID")
    public ResponseEntity<ApiResponse<EmergencyAlertDTO.Response>> getById(@PathVariable Long id) {
        EmergencyAlertDTO.Response response = alertService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/active")
    @Operation(summary = "Obtenir les alertes actives")
    public ResponseEntity<ApiResponse<List<EmergencyAlertDTO.Response>>> getActiveAlerts() {
        List<EmergencyAlertDTO.Response> response = alertService.getActiveAlerts();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/critical")
    @Operation(summary = "Obtenir les alertes critiques")
    public ResponseEntity<ApiResponse<List<EmergencyAlertDTO.Response>>> getCriticalAlerts() {
        List<EmergencyAlertDTO.Response> response = alertService.getCriticalAlerts();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Obtenir les alertes d'un site")
    public ResponseEntity<ApiResponse<PageResponse<EmergencyAlertDTO.Response>>> getBySiteId(
            @PathVariable Long siteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        var result = alertService.getBySiteId(siteId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Obtenir les alertes par statut")
    public ResponseEntity<ApiResponse<PageResponse<EmergencyAlertDTO.Response>>> getByStatus(
            @PathVariable AlertStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        var result = alertService.getByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour une alerte")
    public ResponseEntity<ApiResponse<EmergencyAlertDTO.Response>> updateAlert(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyAlertDTO.UpdateRequest request) {
        EmergencyAlertDTO.Response response = alertService.updateAlert(id, request);
        return ResponseEntity.ok(ApiResponse.success("Alerte mise à jour avec succès", response));
    }

    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Acquitter une alerte")
    public ResponseEntity<ApiResponse<EmergencyAlertDTO.Response>> acknowledgeAlert(
            @PathVariable Long id,
            @RequestParam Long userId) {
        EmergencyAlertDTO.Response response = alertService.acknowledgeAlert(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Alerte acquittée avec succès", response));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Résoudre une alerte")
    public ResponseEntity<ApiResponse<EmergencyAlertDTO.Response>> resolveAlert(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam(required = false) String resolutionNotes) {
        EmergencyAlertDTO.Response response = alertService.resolveAlert(id, userId, resolutionNotes);
        return ResponseEntity.ok(ApiResponse.success("Alerte résolue avec succès", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une alerte")
    public ResponseEntity<ApiResponse<Void>> deleteAlert(@PathVariable Long id) {
        alertService.deleteAlert(id);
        return ResponseEntity.ok(ApiResponse.success("Alerte supprimée avec succès", null));
    }
}
