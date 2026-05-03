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
import tn.esprit.projetintegre.dto.request.MissionRequest;
import tn.esprit.projetintegre.dto.response.MissionResponse;
import tn.esprit.projetintegre.dto.response.UserMissionResponse;
import tn.esprit.projetintegre.entities.Mission;
import tn.esprit.projetintegre.entities.UserMission;
import tn.esprit.projetintegre.enums.MissionType;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.MissionService;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
@Tag(name = "Missions", description = "Mission management APIs")
public class MissionController {

    private final MissionService missionService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all missions")
    public ResponseEntity<ApiResponse<List<MissionResponse>>> getAllMissions() {
        List<Mission> missions = missionService.getAllMissions();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toMissionResponseList(missions)));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get all missions paginated")
    public ResponseEntity<ApiResponse<PageResponse<MissionResponse>>> getAllMissionsPaged(Pageable pageable) {
        Page<Mission> page = missionService.getAllMissions(pageable);
        Page<MissionResponse> response = page.map(dtoMapper::toMissionResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get mission by ID")
    public ResponseEntity<ApiResponse<MissionResponse>> getMissionById(@PathVariable Long id) {
        Mission mission = missionService.getMissionById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toMissionResponse(mission)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active missions")
    public ResponseEntity<ApiResponse<List<MissionResponse>>> getActiveMissions() {
        List<Mission> missions = missionService.getActiveMissions();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toMissionResponseList(missions)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get missions by type")
    public ResponseEntity<ApiResponse<List<MissionResponse>>> getMissionsByType(@PathVariable MissionType type) {
        List<Mission> missions = missionService.getMissionsByType(type);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toMissionResponseList(missions)));
    }

    @PostMapping
    @Operation(summary = "Create a new mission")
    public ResponseEntity<ApiResponse<MissionResponse>> createMission(
            @Valid @RequestBody MissionRequest request) {
        Mission mission = toEntity(request);
        Mission created = missionService.createMission(mission);
        return ResponseEntity.ok(ApiResponse.success("Mission created successfully", dtoMapper.toMissionResponse(created)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a mission")
    public ResponseEntity<ApiResponse<MissionResponse>> updateMission(
            @PathVariable Long id,
            @Valid @RequestBody MissionRequest request) {
        Mission missionDetails = toEntity(request);
        Mission updated = missionService.updateMission(id, missionDetails);
        return ResponseEntity.ok(ApiResponse.success("Mission updated successfully", dtoMapper.toMissionResponse(updated)));
    }

    @PostMapping("/{missionId}/assign/{userId}")
    @Operation(summary = "Assign mission to user")
    public ResponseEntity<ApiResponse<UserMissionResponse>> assignMissionToUser(
            @PathVariable Long missionId,
            @PathVariable Long userId) {
        UserMission userMission = missionService.assignMissionToUser(missionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Mission assigned successfully", dtoMapper.toUserMissionResponse(userMission)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user missions")
    public ResponseEntity<ApiResponse<List<UserMissionResponse>>> getUserMissions(@PathVariable Long userId) {
        List<UserMission> userMissions = missionService.getUserMissions(userId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toUserMissionResponseList(userMissions)));
    }

    @PutMapping("/user-mission/{userMissionId}/progress")
    @Operation(summary = "Update mission progress")
    public ResponseEntity<ApiResponse<UserMissionResponse>> updateProgress(
            @PathVariable Long userMissionId,
            @RequestParam int progress) {
        UserMission userMission = missionService.updateProgress(userMissionId, progress);
        return ResponseEntity.ok(ApiResponse.success("Progress updated successfully", dtoMapper.toUserMissionResponse(userMission)));
    }

    @PostMapping("/user-mission/{userMissionId}/claim-reward")
    @Operation(summary = "Claim mission reward")
    public ResponseEntity<ApiResponse<UserMissionResponse>> claimReward(@PathVariable Long userMissionId) {
        UserMission userMission = missionService.claimReward(userMissionId);
        return ResponseEntity.ok(ApiResponse.success("Reward claimed successfully", dtoMapper.toUserMissionResponse(userMission)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a mission")
    public ResponseEntity<ApiResponse<Void>> deleteMission(@PathVariable Long id) {
        missionService.deleteMission(id);
        return ResponseEntity.ok(ApiResponse.success("Mission deleted successfully", null));
    }

    private Mission toEntity(MissionRequest request) {
        return Mission.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .targetValue(request.getTargetValue())
                .rewardPoints(request.getRewardPoints())
                .rewardBadge(request.getRewardBadge())
                .rewardDescription(request.getRewardDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive())
                .isRepeatable(request.getIsRepeatable())
                .category(request.getCategory())
                .build();
    }
}
