package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.SponsorRequest;
import tn.esprit.projetintegre.dto.request.SponsorshipRequest;
import tn.esprit.projetintegre.dto.response.SponsorResponse;
import tn.esprit.projetintegre.dto.response.SponsorshipResponse;
import tn.esprit.projetintegre.dto.response.UserSponsorRequestResponse;
import tn.esprit.projetintegre.entities.Sponsor;
import tn.esprit.projetintegre.entities.Sponsorship;
import tn.esprit.projetintegre.enums.Role;
import tn.esprit.projetintegre.enums.SponsorStatus;
import tn.esprit.projetintegre.enums.SponsorTier;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.repositories.SponsorRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.services.SponsorService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sponsors")
@RequiredArgsConstructor
@Tag(name = "Sponsors", description = "Sponsor and Sponsorship management APIs")
public class SponsorController {

    private final SponsorService sponsorService;
    private final DtoMapper dtoMapper;
    private final UserRepository userRepository;
    private final SponsorRepository sponsorRepository;

    @GetMapping
    @Operation(summary = "Get all sponsors")
    public ResponseEntity<ApiResponse<List<SponsorResponse>>> getAllSponsors() {
        List<Sponsor> sponsors = sponsorService.getAllSponsors();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorResponseList(sponsors)));
    }

    // Frontend compatibility alias
    @GetMapping("/all")
    @Operation(summary = "Get all sponsors (alias)")
    public ResponseEntity<ApiResponse<List<SponsorResponse>>> getAllSponsorsAlias() {
        return getAllSponsors();
    }

    @GetMapping("/paged")
    @Operation(summary = "Get all sponsors paginated")
    public ResponseEntity<ApiResponse<PageResponse<SponsorResponse>>> getAllSponsorsPaged(Pageable pageable) {
        Page<Sponsor> page = sponsorService.getAllSponsors(pageable);
        Page<SponsorResponse> response = page.map(dtoMapper::toSponsorResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sponsor by ID")
    public ResponseEntity<ApiResponse<SponsorResponse>> getSponsorById(@PathVariable Long id) {
        Sponsor sponsor = sponsorService.getSponsorById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorResponse(sponsor)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active sponsors")
    public ResponseEntity<ApiResponse<List<SponsorResponse>>> getActiveSponsors() {
        List<Sponsor> sponsors = sponsorService.getActiveSponsors();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorResponseList(sponsors)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search sponsors")
    public ResponseEntity<ApiResponse<List<SponsorResponse>>> searchSponsors(@RequestParam String keyword) {
        List<Sponsor> sponsors = sponsorService.searchSponsors(keyword);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorResponseList(sponsors)));
    }

    @PostMapping
    @Operation(summary = "Create a new sponsor")
    public ResponseEntity<ApiResponse<SponsorResponse>> createSponsor(
            @Valid @RequestBody SponsorRequest request) {
        Sponsor sponsor = toSponsorEntity(request);
        Sponsor created = sponsorService.createSponsor(sponsor);
        return ResponseEntity.ok(ApiResponse.success("Sponsor created successfully", dtoMapper.toSponsorResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a sponsor")
    public ResponseEntity<ApiResponse<SponsorResponse>> updateSponsor(
            @PathVariable Long id,
            @Valid @RequestBody SponsorRequest request) {
        Sponsor sponsorDetails = toSponsorEntity(request);
        Sponsor updated = sponsorService.updateSponsor(id, sponsorDetails);
        return ResponseEntity.ok(ApiResponse.success("Sponsor updated successfully", dtoMapper.toSponsorResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a sponsor")
    public ResponseEntity<ApiResponse<Void>> deleteSponsor(@PathVariable Long id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.ok(ApiResponse.success("Sponsor deleted successfully", null));
    }

    @GetMapping("/sponsorships")
    @Operation(summary = "Get all sponsorships")
    public ResponseEntity<ApiResponse<List<SponsorshipResponse>>> getAllSponsorships() {
        List<Sponsorship> sponsorships = sponsorService.getAllSponsorships();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorshipResponseList(sponsorships)));
    }

    @GetMapping("/sponsorships/paged")
    @Operation(summary = "Get all sponsorships paginated")
    public ResponseEntity<ApiResponse<PageResponse<SponsorshipResponse>>> getAllSponsorshipsPaged(Pageable pageable) {
        Page<Sponsorship> page = sponsorService.getAllSponsorships(pageable);
        Page<SponsorshipResponse> response = page.map(dtoMapper::toSponsorshipResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/sponsorships/{id}")
    @Operation(summary = "Get sponsorship by ID")
    public ResponseEntity<ApiResponse<SponsorshipResponse>> getSponsorshipById(@PathVariable Long id) {
        Sponsorship sponsorship = sponsorService.getSponsorshipById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorshipResponse(sponsorship)));
    }

    @GetMapping("/{sponsorId}/sponsorships")
    @Operation(summary = "Get sponsorships by sponsor ID")
    public ResponseEntity<ApiResponse<List<SponsorshipResponse>>> getSponsorshipsBySponsorId(@PathVariable Long sponsorId) {
        List<Sponsorship> sponsorships = sponsorService.getSponsorshipsBySponsorId(sponsorId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorshipResponseList(sponsorships)));
    }

    @GetMapping("/sponsorships/event/{eventId}")
    @Operation(summary = "Get sponsorships by event ID")
    public ResponseEntity<ApiResponse<List<SponsorshipResponse>>> getSponsorshipsByEventId(@PathVariable Long eventId) {
        List<Sponsorship> sponsorships = sponsorService.getSponsorshipsByEventId(eventId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toSponsorshipResponseList(sponsorships)));
    }

    @PostMapping("/sponsorships")
    @Operation(summary = "Create a new sponsorship")
    public ResponseEntity<ApiResponse<SponsorshipResponse>> createSponsorship(
            @Valid @RequestBody SponsorshipRequest request,
            @RequestParam Long sponsorId,
            @RequestParam Long eventId) {
        Sponsorship sponsorship = toSponsorshipEntity(request);
        Sponsorship created = sponsorService.createSponsorship(sponsorship, sponsorId, eventId);
        return ResponseEntity.ok(ApiResponse.success("Sponsorship created successfully", dtoMapper.toSponsorshipResponse(created)));
    }

    @PutMapping("/sponsorships/{id}")
    @Operation(summary = "Update a sponsorship")
    public ResponseEntity<ApiResponse<SponsorshipResponse>> updateSponsorship(
            @PathVariable Long id,
            @Valid @RequestBody SponsorshipRequest request) {
        Sponsorship sponsorshipDetails = toSponsorshipEntity(request);
        Sponsorship updated = sponsorService.updateSponsorship(id, sponsorshipDetails);
        return ResponseEntity.ok(ApiResponse.success("Sponsorship updated successfully", dtoMapper.toSponsorshipResponse(updated)));
    }

    @PutMapping("/sponsorships/{id}/mark-paid")
    @Operation(summary = "Mark sponsorship as paid")
    public ResponseEntity<ApiResponse<SponsorshipResponse>> markAsPaid(@PathVariable Long id) {
        Sponsorship updated = sponsorService.markAsPaid(id);
        return ResponseEntity.ok(ApiResponse.success("Sponsorship marked as paid", dtoMapper.toSponsorshipResponse(updated)));
    }

    @PutMapping("/sponsorships/{id}/status")
    @Operation(summary = "Update sponsorship status")
    public ResponseEntity<ApiResponse<SponsorshipResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Sponsorship updated = sponsorService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Sponsorship status updated", dtoMapper.toSponsorshipResponse(updated)));
    }

    @DeleteMapping("/sponsorships/{id}")
    @Operation(summary = "Delete a sponsorship")
    public ResponseEntity<ApiResponse<Void>> deleteSponsorship(@PathVariable Long id) {
        sponsorService.deleteSponsorship(id);
        return ResponseEntity.ok(ApiResponse.success("Sponsorship deleted successfully", null));
    }

    @GetMapping("/pending-requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending sponsor signup requests")
    public ResponseEntity<ApiResponse<List<UserSponsorRequestResponse>>> getPendingSponsorRequests() {
        var users = userRepository.findBySponsorStatus(SponsorStatus.PENDING);
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

    @PutMapping("/pending-requests/{userId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve sponsor signup request")
    public ResponseEntity<ApiResponse<Void>> approveSponsorRequest(@PathVariable Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(Role.SPONSOR);
        user.setSponsorStatus(SponsorStatus.APPROVED);
        user.setSponsorReviewedAt(LocalDateTime.now());
        userRepository.save(user);

        // Ensure approved sponsor is visible in sponsor pages.
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

        return ResponseEntity.ok(ApiResponse.success("Sponsor request approved", null));
    }

    @PutMapping("/pending-requests/{userId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject sponsor signup request")
    public ResponseEntity<ApiResponse<Void>> rejectSponsorRequest(@PathVariable Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setSponsorStatus(SponsorStatus.REJECTED);
        user.setSponsorReviewedAt(LocalDateTime.now());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Sponsor request rejected", null));
    }

    private Sponsorship toSponsorshipEntity(SponsorshipRequest request) {
        return Sponsorship.builder()
                .amount(request.getAmount())
                .sponsorshipType(request.getSponsorshipType())
                .sponsorshipLevel(request.getSponsorshipLevel())
                .description(request.getDescription())
                .currency(request.getCurrency())
                .benefits(request.getBenefits())
                .deliverables(request.getDeliverables())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .notes(request.getNotes())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .status(request.getStatus() != null ? request.getStatus() : "PENDING")
                .build();
    }

    private Sponsor toSponsorEntity(SponsorRequest request) {
        return Sponsor.builder()
                .name(request.getName())
                .description(request.getDescription())
                .logo(request.getLogo())
                .website(request.getWebsite())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .contactPerson(request.getContactPerson())
                .contactPosition(request.getContactPosition())
                .notes(request.getNotes())
                .tier(request.getTier() != null ? request.getTier() : SponsorTier.BRONZE)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }
}
