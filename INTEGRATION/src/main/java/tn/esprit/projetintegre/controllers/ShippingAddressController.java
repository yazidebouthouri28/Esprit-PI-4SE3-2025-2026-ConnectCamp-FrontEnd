package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.ShippingAddressRequest;
import tn.esprit.projetintegre.dto.response.ShippingAddressResponse;
import tn.esprit.projetintegre.services.ShippingAddressService;

import java.util.List;

@RestController
@RequestMapping("/api/shipping-addresses")
@RequiredArgsConstructor
@Tag(name = "Adresses de livraison", description = "Gestion des adresses de livraison")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ShippingAddressController {

    private final ShippingAddressService addressService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Liste les adresses d'un utilisateur")
    public ResponseEntity<ApiResponse<List<ShippingAddressResponse>>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(addressService.getByUserId(userId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère une adresse par ID")
    public ResponseEntity<ApiResponse<ShippingAddressResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(addressService.getById(id)));
    }

    @GetMapping("/user/{userId}/default")
    @Operation(summary = "Récupère l'adresse par défaut d'un utilisateur")
    public ResponseEntity<ApiResponse<ShippingAddressResponse>> getDefaultByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(addressService.getDefaultByUserId(userId)));
    }

    @PostMapping
    @Operation(summary = "Crée une nouvelle adresse")
    public ResponseEntity<ApiResponse<ShippingAddressResponse>> create(@Valid @RequestBody ShippingAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Adresse créée avec succès", addressService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Met à jour une adresse")
    public ResponseEntity<ApiResponse<ShippingAddressResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ShippingAddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Adresse mise à jour", addressService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactive une adresse")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        addressService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Adresse désactivée", null));
    }
}
