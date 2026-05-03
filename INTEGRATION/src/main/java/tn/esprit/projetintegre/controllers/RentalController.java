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
import tn.esprit.projetintegre.dto.request.RentalRequest;
import tn.esprit.projetintegre.dto.response.RentalResponse;
import tn.esprit.projetintegre.enums.RentalStatus;
import tn.esprit.projetintegre.services.RentalService;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
@Tag(name = "Locations", description = "Gestion des locations de matériel")
public class RentalController {

    private final RentalService rentalService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste toutes les locations")
    public ResponseEntity<ApiResponse<List<RentalResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(rentalService.getAll()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Liste paginée des locations d'un utilisateur")
    public ResponseEntity<ApiResponse<PageResponse<RentalResponse>>> getByUserId(
            @PathVariable Long userId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(rentalService.getByUserId(userId, pageable))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère une location par ID")
    public ResponseEntity<ApiResponse<RentalResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(rentalService.getById(id)));
    }

    @GetMapping("/number/{number}")
    @Operation(summary = "Récupère une location par numéro")
    public ResponseEntity<ApiResponse<RentalResponse>> getByNumber(@PathVariable String number) {
        return ResponseEntity.ok(ApiResponse.success(rentalService.getByRentalNumber(number)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Crée une nouvelle location")
    public ResponseEntity<ApiResponse<RentalResponse>> create(@Valid @RequestBody RentalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Location créée avec succès", rentalService.create(request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    @Operation(summary = "Met à jour le statut d'une location")
    public ResponseEntity<ApiResponse<RentalResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam RentalStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Statut mis à jour", rentalService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprime une location")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        rentalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Location supprimée", null));
    }
}
