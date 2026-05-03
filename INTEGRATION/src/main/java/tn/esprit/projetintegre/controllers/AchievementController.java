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
import tn.esprit.projetintegre.dto.request.AchievementRequest;
import tn.esprit.projetintegre.dto.response.AchievementResponse;
import tn.esprit.projetintegre.dto.response.UserAchievementResponse;
import tn.esprit.projetintegre.entities.Achievement;
import tn.esprit.projetintegre.entities.UserAchievement;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.AchievementService;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
@Tag(name = "Achievements", description = "Achievement management APIs")
public class AchievementController {

    private final AchievementService achievementService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all achievements")
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getAllAchievements() {
        List<Achievement> achievements = achievementService.getAllAchievements();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAchievementResponseList(achievements)));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get all achievements paginated")
    public ResponseEntity<ApiResponse<PageResponse<AchievementResponse>>> getAllAchievementsPaged(Pageable pageable) {
        Page<Achievement> page = achievementService.getAllAchievements(pageable);
        Page<AchievementResponse> response = page.map(dtoMapper::toAchievementResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get achievement by ID")
    public ResponseEntity<ApiResponse<AchievementResponse>> getAchievementById(@PathVariable Long id) {
        Achievement achievement = achievementService.getAchievementById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAchievementResponse(achievement)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active achievements")
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getActiveAchievements() {
        List<Achievement> achievements = achievementService.getActiveAchievements();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAchievementResponseList(achievements)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get achievements by category")
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getAchievementsByCategory(@PathVariable String category) {
        List<Achievement> achievements = achievementService.getAchievementsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toAchievementResponseList(achievements)));
    }

    @PostMapping
    @Operation(summary = "Create a new achievement")
    public ResponseEntity<ApiResponse<AchievementResponse>> createAchievement(
            @Valid @RequestBody AchievementRequest request) {
        Achievement achievement = toEntity(request);
        Achievement created = achievementService.createAchievement(achievement);
        return ResponseEntity.ok(ApiResponse.success("Achievement created successfully", dtoMapper.toAchievementResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an achievement")
    public ResponseEntity<ApiResponse<AchievementResponse>> updateAchievement(
            @PathVariable Long id,
            @Valid @RequestBody AchievementRequest request) {
        Achievement achievementDetails = toEntity(request);
        Achievement updated = achievementService.updateAchievement(id, achievementDetails);
        return ResponseEntity.ok(ApiResponse.success("Achievement updated successfully", dtoMapper.toAchievementResponse(updated)));
    }

    @PostMapping("/{achievementId}/unlock/{userId}")
    @Operation(summary = "Unlock achievement for user")
    public ResponseEntity<ApiResponse<UserAchievementResponse>> unlockAchievement(
            @PathVariable Long achievementId,
            @PathVariable Long userId) {
        UserAchievement userAchievement = achievementService.unlockAchievement(achievementId, userId);
        return ResponseEntity.ok(ApiResponse.success("Achievement unlocked successfully", dtoMapper.toUserAchievementResponse(userAchievement)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user achievements")
    public ResponseEntity<ApiResponse<List<UserAchievementResponse>>> getUserAchievements(@PathVariable Long userId) {
        List<UserAchievement> userAchievements = achievementService.getUserAchievements(userId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toUserAchievementResponseList(userAchievements)));
    }

    @GetMapping("/user/{userId}/displayed")
    @Operation(summary = "Get displayed achievements for user")
    public ResponseEntity<ApiResponse<List<UserAchievementResponse>>> getDisplayedAchievements(@PathVariable Long userId) {
        List<UserAchievement> userAchievements = achievementService.getDisplayedAchievements(userId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toUserAchievementResponseList(userAchievements)));
    }

    @PutMapping("/user-achievement/{userAchievementId}/toggle-display")
    @Operation(summary = "Toggle achievement display")
    public ResponseEntity<ApiResponse<UserAchievementResponse>> toggleDisplay(@PathVariable Long userAchievementId) {
        UserAchievement userAchievement = achievementService.toggleDisplay(userAchievementId);
        return ResponseEntity.ok(ApiResponse.success("Display toggled successfully", dtoMapper.toUserAchievementResponse(userAchievement)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an achievement")
    public ResponseEntity<ApiResponse<Void>> deleteAchievement(@PathVariable Long id) {
        achievementService.deleteAchievement(id);
        return ResponseEntity.ok(ApiResponse.success("Achievement deleted successfully", null));
    }

    private Achievement toEntity(AchievementRequest request) {
        return Achievement.builder()
                .name(request.getName())
                .description(request.getDescription())
                .badge(request.getBadge())
                .icon(request.getIcon())
                .requiredPoints(request.getRequiredPoints())
                .rewardPoints(request.getRewardPoints())
                .category(request.getCategory())
                .level(request.getLevel())
                .isActive(request.getIsActive())
                .build();
    }
}
