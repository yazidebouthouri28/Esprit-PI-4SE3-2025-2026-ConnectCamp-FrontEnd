package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.GamificationRequest;
import tn.esprit.projetintegre.dto.response.GamificationResponse;
import tn.esprit.projetintegre.entities.Gamification;
import tn.esprit.projetintegre.entities.Organizer;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.repositories.OrganizerRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.services.GamificationService;

import java.util.List;

@RestController
@RequestMapping("/api/gamifications")
@RequiredArgsConstructor
@Tag(name = "Gamification", description = "Gamification & Badges management")
@SecurityRequirement(name = "Bearer Authentication")
public class GamificationController {

    private final GamificationService gamificationService;
    private final DtoMapper dtoMapper;
    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return userRepository.findByUsername(authentication.getName())
                .or(() -> userRepository.findByEmail(authentication.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Organizer getAuthenticatedOrganizer(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return organizerRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Organizer profile required"));
    }

    @GetMapping
    @Operation(summary = "Get all gamifications")
    public ResponseEntity<ApiResponse<List<GamificationResponse>>> getAllGamifications(
            @RequestParam(required = false) Long organizerId,
            Authentication authentication) {

        List<Gamification> gamifications;

        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"))) {
            if (organizerId != null) {
                gamifications = gamificationService.getGamificationsByOrganizer(organizerId);
            } else {
                gamifications = gamificationService.getAllGamifications();
            }
        } else if (authentication != null) {
            // Organizer case
            Organizer organizer = getAuthenticatedOrganizer(authentication);
            gamifications = gamificationService.getGamificationsByOrganizer(organizer.getId());
        } else {
            // Public case
            gamifications = gamificationService.getAllGamifications();
        }

        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toGamificationResponseList(gamifications)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get gamification by ID")
    public ResponseEntity<ApiResponse<GamificationResponse>> getGamificationById(@PathVariable Long id) {
        Gamification gamification = gamificationService.getGamificationById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toGamificationResponse(gamification)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Create new gamification")
    public ResponseEntity<ApiResponse<GamificationResponse>> createGamification(
            @Valid @RequestBody GamificationRequest request,
            Authentication authentication) {

        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ORGANIZER") || a.getAuthority().equals("ORGANIZER"))) {
            Organizer organizer = getAuthenticatedOrganizer(authentication);
            request.setOrganizerId(organizer.getId());
        }

        Gamification gamification = gamificationService.createGamification(request);
        return ResponseEntity.ok(ApiResponse.success("Gamification created successfully",
                dtoMapper.toGamificationResponse(gamification)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Update gamification")
    public ResponseEntity<ApiResponse<GamificationResponse>> updateGamification(@PathVariable Long id,
            @Valid @RequestBody GamificationRequest request,
            Authentication authentication) {

        Gamification existing = gamificationService.getGamificationById(id);

        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ORGANIZER") || a.getAuthority().equals("ORGANIZER"))) {
            Organizer organizer = getAuthenticatedOrganizer(authentication);

            if (existing.getOrganizer() == null || !existing.getOrganizer().getId().equals(organizer.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own badges");
            }
            request.setOrganizerId(organizer.getId());
        }

        Gamification gamification = gamificationService.updateGamification(id, request);
        return ResponseEntity.ok(ApiResponse.success("Gamification updated successfully",
                dtoMapper.toGamificationResponse(gamification)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Delete gamification")
    public ResponseEntity<ApiResponse<Void>> deleteGamification(@PathVariable Long id,
            Authentication authentication) {

        Gamification existing = gamificationService.getGamificationById(id);

        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ORGANIZER") || a.getAuthority().equals("ORGANIZER"))) {
            Organizer organizer = getAuthenticatedOrganizer(authentication);

            if (existing.getOrganizer() == null || !existing.getOrganizer().getId().equals(organizer.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own badges");
            }
        }

        gamificationService.deleteGamification(id);
        return ResponseEntity.ok(ApiResponse.success("Gamification deleted successfully", null));
    }

    @PostMapping("/{gamificationId}/assign/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Assign a badge to an event")
    public ResponseEntity<ApiResponse<Void>> assignToEvent(@PathVariable Long gamificationId,
            @PathVariable Long eventId) {
        gamificationService.assignGamificationToEvent(gamificationId, eventId);
        return ResponseEntity.ok(ApiResponse.success("Gamification assigned to event", null));
    }

    @DeleteMapping("/{gamificationId}/unassign/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Remove a badge from an event")
    public ResponseEntity<ApiResponse<Void>> unassignFromEvent(@PathVariable Long gamificationId,
            @PathVariable Long eventId) {
        gamificationService.removeGamificationFromEvent(gamificationId, eventId);
        return ResponseEntity.ok(ApiResponse.success("Gamification removed from event", null));
    }
}
