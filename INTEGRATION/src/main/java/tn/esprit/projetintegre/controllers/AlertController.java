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
import tn.esprit.projetintegre.dto.request.AlertRequest;
import tn.esprit.projetintegre.dto.response.AlertResponse;
import tn.esprit.projetintegre.entities.Alert;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.AlertService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Tag(name = "Alerts", description = "Alert management APIs")
public class AlertController {

    private final AlertService alertService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all alerts")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getAllAlerts() {
        List<Alert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAlertResponseList(alerts)));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get all alerts paginated")
    public ResponseEntity<ApiResponse<PageResponse<AlertResponse>>> getAllAlertsPaged(Pageable pageable) {
        Page<Alert> page = alertService.getAllAlerts(pageable);
        Page<AlertResponse> response = page.map(dtoMapper::toAlertResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get alert by ID")
    public ResponseEntity<ApiResponse<AlertResponse>> getAlertById(@PathVariable Long id) {
        Alert alert = alertService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAlertResponse(alert)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get alerts by status")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getAlertsByStatus(@PathVariable AlertStatus status) {
        List<Alert> alerts = alertService.getAlertsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAlertResponseList(alerts)));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Get alerts by site ID")
    public ResponseEntity<ApiResponse<PageResponse<AlertResponse>>> getAlertsBySiteId(
            @PathVariable Long siteId, Pageable pageable) {
        Page<Alert> page = alertService.getAlertsBySiteId(siteId, pageable);
        Page<AlertResponse> response = page.map(dtoMapper::toAlertResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @PostMapping
    @Operation(summary = "Create a new alert")
    public ResponseEntity<ApiResponse<AlertResponse>> createAlert(
            @Valid @RequestBody AlertRequest request,
            @RequestParam Long reportedById,
            @RequestParam(required = false) Long siteId) {
        Alert alert = toEntity(request);
        Alert created = alertService.createAlert(alert, reportedById, siteId);
        return ResponseEntity.ok(ApiResponse.success("Alert created successfully", dtoMapper.toAlertResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an alert")
    public ResponseEntity<ApiResponse<AlertResponse>> updateAlert(
            @PathVariable Long id,
            @Valid @RequestBody AlertRequest request) {
        Alert alertDetails = toEntity(request);
        Alert updated = alertService.updateAlert(id, alertDetails);
        return ResponseEntity.ok(ApiResponse.success("Alert updated successfully", dtoMapper.toAlertResponse(updated)));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Resolve an alert")
    public ResponseEntity<ApiResponse<AlertResponse>> resolveAlert(
            @PathVariable Long id,
            @RequestParam Long resolvedById,
            @RequestParam(required = false) String resolutionNotes) {
        Alert resolved = alertService.resolveAlert(id, resolvedById, resolutionNotes);
        return ResponseEntity.ok(ApiResponse.success("Alert resolved successfully", dtoMapper.toAlertResponse(resolved)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an alert")
    public ResponseEntity<ApiResponse<Void>> deleteAlert(@PathVariable Long id) {
        alertService.deleteAlert(id);
        return ResponseEntity.ok(ApiResponse.success("Alert deleted successfully", null));
    }

    private Alert toEntity(AlertRequest request) {
        return Alert.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .alertType(request.getAlertType())
                .severity(request.getSeverity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(request.getLocation())
                .build();
    }
}
