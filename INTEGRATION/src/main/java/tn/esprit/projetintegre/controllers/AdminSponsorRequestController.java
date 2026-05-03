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
import tn.esprit.projetintegre.repositories.SponsorRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.entities.Sponsor;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/sponsor-requests")
@RequiredArgsConstructor
@Tag(name = "Admin - Sponsor Requests", description = "Approve/reject sponsor signups")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSponsorRequestController {

    private final UserRepository userRepository;
    private final SponsorRepository sponsorRepository;

    @GetMapping
    @Operation(summary = "List pending sponsor signup requests")
    public ResponseEntity<ApiResponse<List<UserSponsorRequestResponse>>> getPending() {
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
    @Operation(summary = "Approve a sponsor signup request")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setSponsorStatus(SponsorStatus.APPROVED);
        user.setSponsorReviewedAt(LocalDateTime.now());
        userRepository.save(user);

        // Create Sponsor row upon approval (idempotent by email)
        if (user.getEmail() != null && !sponsorRepository.existsByEmail(user.getEmail())) {
            Sponsor sponsor = Sponsor.builder()
                    .name(user.getName() != null ? user.getName() : user.getUsername())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .address(user.getAddress())
                    .country(user.getCountry())
                    .isActive(true)
                    .build();
            sponsorRepository.save(sponsor);
        }

        return ResponseEntity.ok(ApiResponse.success("Sponsor approved", null));
    }

    @PutMapping("/{userId}/reject")
    @Operation(summary = "Reject a sponsor signup request")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setSponsorStatus(SponsorStatus.REJECTED);
        user.setSponsorReviewedAt(LocalDateTime.now());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Sponsor rejected", null));
    }
}

