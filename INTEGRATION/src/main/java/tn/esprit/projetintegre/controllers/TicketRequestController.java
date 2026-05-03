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
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.TicketRequestDTO;
import tn.esprit.projetintegre.enums.TicketRequestStatus;
import tn.esprit.projetintegre.services.TicketRequestService;

@RestController
@RequestMapping("/api/ticket-requests")
@RequiredArgsConstructor
@Tag(name = "Demandes de Billets", description = "API pour la gestion des demandes de billets")
public class TicketRequestController {

    private final TicketRequestService ticketRequestService;

    @PostMapping
    @Operation(summary = "Créer une demande de billet")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> createRequest(
            @RequestParam Long userId,
            @Valid @RequestBody TicketRequestDTO.CreateRequest request) {
        TicketRequestDTO.Response response = ticketRequestService.createRequest(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Demande de billet créée avec succès", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir une demande par ID")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> getById(@PathVariable Long id) {
        TicketRequestDTO.Response response = ticketRequestService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/number/{requestNumber}")
    @Operation(summary = "Obtenir une demande par numéro")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> getByRequestNumber(
            @PathVariable String requestNumber) {
        TicketRequestDTO.Response response = ticketRequestService.getByRequestNumber(requestNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtenir les demandes d'un utilisateur")
    public ResponseEntity<ApiResponse<PageResponse<TicketRequestDTO.Response>>> getByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = PageRequest.of(page, size, 
                sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending());
        var result = ticketRequestService.getByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Obtenir les demandes pour un événement")
    public ResponseEntity<ApiResponse<PageResponse<TicketRequestDTO.Response>>> getByEventId(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = ticketRequestService.getByEventId(eventId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtenir les demandes par statut")
    public ResponseEntity<ApiResponse<PageResponse<TicketRequestDTO.Response>>> getByStatus(
            @PathVariable TicketRequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        var result = ticketRequestService.getByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une demande")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody TicketRequestDTO.UpdateRequest request) {
        TicketRequestDTO.Response response = ticketRequestService.updateRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Demande mise à jour avec succès", response));
    }

    @PutMapping("/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Traiter une demande de billet")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> processRequest(
            @PathVariable Long id,
            @RequestParam Long processedById,
            @Valid @RequestBody TicketRequestDTO.ProcessRequest request) {
        TicketRequestDTO.Response response = ticketRequestService.processRequest(id, processedById, request);
        return ResponseEntity.ok(ApiResponse.success("Demande traitée avec succès", response));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Annuler une demande")
    public ResponseEntity<ApiResponse<TicketRequestDTO.Response>> cancelRequest(
            @PathVariable Long id,
            @RequestParam Long userId) {
        TicketRequestDTO.Response response = ticketRequestService.cancelRequest(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Demande annulée avec succès", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une demande")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
        ticketRequestService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Demande supprimée avec succès", null));
    }
}
