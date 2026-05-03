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
import tn.esprit.projetintegre.dto.request.ParticipantRequest;
import tn.esprit.projetintegre.dto.response.ParticipantResponse;
import tn.esprit.projetintegre.services.ParticipantService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
@Tag(name = "Participants", description = "Gestion des participants aux événements")
public class ParticipantController {

    private final ParticipantService participantService;

    @GetMapping
    @Operation(summary = "Liste tous les participants")
    public ResponseEntity<ApiResponse<List<ParticipantResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(participantService.getAll()));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Liste paginée des participants d'un événement")
    public ResponseEntity<ApiResponse<PageResponse<ParticipantResponse>>> getByEventId(
            @PathVariable Long eventId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(participantService.getByEventId(eventId, pageable))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère un participant par ID")
    public ResponseEntity<ApiResponse<ParticipantResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(participantService.getById(id)));
    }

    @GetMapping("/event/{eventId}/stats")
    @Operation(summary = "Statistiques des participants d'un événement")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats(@PathVariable Long eventId) {
        Map<String, Long> stats = Map.of(
                "total", participantService.countByEventId(eventId),
                "checkedIn", participantService.countCheckedInByEventId(eventId)
        );
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    @Operation(summary = "Inscrit un nouveau participant")
    public ResponseEntity<ApiResponse<ParticipantResponse>> create(@Valid @RequestBody ParticipantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Participant inscrit avec succès", participantService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    @Operation(summary = "Met à jour un participant")
    public ResponseEntity<ApiResponse<ParticipantResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ParticipantRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Participant mis à jour", participantService.update(id, request)));
    }

    @PostMapping("/{id}/checkin")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Enregistre le check-in d'un participant")
    public ResponseEntity<ApiResponse<ParticipantResponse>> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Check-in enregistré", participantService.checkIn(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Supprime un participant")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        participantService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Participant supprimé", null));
    }
}
