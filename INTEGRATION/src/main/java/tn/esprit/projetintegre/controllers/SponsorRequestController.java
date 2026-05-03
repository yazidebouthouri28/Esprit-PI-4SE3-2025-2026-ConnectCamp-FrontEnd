package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.response.UserSponsorRequestResponse;
import tn.esprit.projetintegre.enums.Role;
import tn.esprit.projetintegre.enums.SponsorStatus;
import tn.esprit.projetintegre.enums.SponsorTier;
import tn.esprit.projetintegre.entities.Sponsor;
import tn.esprit.projetintegre.repositories.CartRepository;
import tn.esprit.projetintegre.repositories.SponsorRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.WalletRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Alias endpoints for frontend compatibility.
 * Some UIs call sponsor-requests under /api/sponsors/requests instead of /api/admin/sponsor-requests.
 */
@RestController
@RequestMapping("/api/sponsors/requests")
@RequiredArgsConstructor
@Tag(name = "Sponsor Requests", description = "Sponsor signup requests (admin only)")
@PreAuthorize("hasRole('ADMIN')")
public class SponsorRequestController {

    private final UserRepository userRepository;
    private final SponsorRepository sponsorRepository;
    private final CartRepository cartRepository;
    private final WalletRepository walletRepository;

    @GetMapping
    @Operation(summary = "List pending sponsor signup requests (alias)")
    public ResponseEntity<ApiResponse<List<UserSponsorRequestResponse>>> pendingAlias() {
        return pending();
    }

    @GetMapping("/pending")
    @Operation(summary = "List pending sponsor signup requests")
    public ResponseEntity<ApiResponse<List<UserSponsorRequestResponse>>> pending() {
        var users = userRepository.findByRoleAndSponsorStatus(Role.SPONSOR, SponsorStatus.PENDING);
        var response = users.stream().map(u -> UserSponsorRequestResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .username(u.getUsername())
                .sponsorStatus(u.getSponsorStatus())
                .createdAt(u.getCreatedAt())
                .build()).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{userId}/approve")
    @Operation(summary = "Approve a sponsor signup request (frontend-compatible)")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long userId,
            @RequestParam(required = false) SponsorTier tier
    ) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(Role.SPONSOR);
        user.setSponsorStatus(SponsorStatus.APPROVED);
        user.setSponsorReviewedAt(LocalDateTime.now());
        userRepository.save(user);

        // Ensure approved sponsor appears in sponsors lists/management.
        if (user.getEmail() != null) {
            Sponsor sponsor = sponsorRepository.findByEmail(user.getEmail())
                    .orElseGet(() -> Sponsor.builder()
                            .email(user.getEmail())
                            .build());

            sponsor.setName(user.getName() != null ? user.getName() : user.getUsername());
            sponsor.setPhone(user.getPhone());
            sponsor.setAddress(user.getAddress());
            sponsor.setCountry(user.getCountry());
            sponsor.setIsActive(true);
            sponsor.setTier(tier != null ? tier : (sponsor.getTier() != null ? sponsor.getTier() : SponsorTier.BRONZE));
            sponsorRepository.save(sponsor);
        }

        return ResponseEntity.ok(ApiResponse.success("Sponsor approved", null));
    }

    @PutMapping("/{userId}/reject")
    @Operation(summary = "Reject a sponsor signup request (deletes user)")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Case2: rejected => completely removed from DB (including cart/wallet created at signup)
        cartRepository.findByUserId(userId).ifPresent(cartRepository::delete);
        walletRepository.findByUserId(userId).ifPresent(walletRepository::delete);
        userRepository.delete(user);

        return ResponseEntity.ok(ApiResponse.success("Sponsor rejected and deleted", null));
    }
}

