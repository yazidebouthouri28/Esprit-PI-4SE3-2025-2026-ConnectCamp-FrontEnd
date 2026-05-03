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
import tn.esprit.projetintegre.dto.request.WarehouseRequest;
import tn.esprit.projetintegre.dto.response.WarehouseResponse;
import tn.esprit.projetintegre.services.WarehouseService;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
@Tag(name = "Entrepôts", description = "Gestion des entrepôts")
@PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @Operation(summary = "Liste tous les entrepôts")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getAll()));
    }

    @GetMapping("/paginated")
    @Operation(summary = "Liste paginée des entrepôts")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseResponse>>> getAllPaginated(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(warehouseService.getAllPaginated(pageable))));
    }

    @GetMapping("/active")
    @Operation(summary = "Liste les entrepôts actifs")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getActive()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère un entrepôt par ID")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getById(id)));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Récupère un entrepôt par code")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getByCode(code)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crée un nouvel entrepôt")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Entrepôt créé avec succès", warehouseService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Met à jour un entrepôt")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WarehouseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Entrepôt mis à jour", warehouseService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Désactive un entrepôt")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Entrepôt désactivé", null));
    }
}
