package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Mission;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.UserMission;
import tn.esprit.projetintegre.enums.MissionType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.MissionRepository;
import tn.esprit.projetintegre.repositories.UserMissionRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MissionService {

    private final MissionRepository missionRepository;
    private final UserMissionRepository userMissionRepository;
    private final UserRepository userRepository;

    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    public Page<Mission> getAllMissions(Pageable pageable) {
        return missionRepository.findAll(pageable);
    }

    public Mission getMissionById(Long id) {
        return missionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found with id: " + id));
    }

    public List<Mission> getActiveMissions() {
        return missionRepository.findByIsActiveTrue();
    }

    public List<Mission> getMissionsByType(MissionType type) {
        return missionRepository.findByType(type);
    }

    public Mission createMission(Mission mission) {
        mission.setIsActive(true);
        return missionRepository.save(mission);
    }

    public Mission updateMission(Long id, Mission missionDetails) {
        Mission mission = getMissionById(id);
        mission.setName(missionDetails.getName());
        mission.setDescription(missionDetails.getDescription());
        mission.setType(missionDetails.getType());
        mission.setTargetValue(missionDetails.getTargetValue());
        mission.setRewardPoints(missionDetails.getRewardPoints());
        mission.setRewardBadge(missionDetails.getRewardBadge());
        mission.setStartDate(missionDetails.getStartDate());
        mission.setEndDate(missionDetails.getEndDate());
        mission.setIsRepeatable(missionDetails.getIsRepeatable());
        return missionRepository.save(mission);
    }

    public UserMission assignMissionToUser(Long missionId, Long userId) {
        Mission mission = getMissionById(missionId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserMission userMission = UserMission.builder()
                .mission(mission)
                .user(user)
                .currentProgress(0)
                .isCompleted(false)
                .rewardClaimed(false)
                .startedAt(LocalDateTime.now())
                .build();

        return userMissionRepository.save(userMission);
    }

    public List<UserMission> getUserMissions(Long userId) {
        return userMissionRepository.findByUserId(userId);
    }

    public UserMission updateProgress(Long userMissionId, int progress) {
        UserMission userMission = userMissionRepository.findById(userMissionId)
                .orElseThrow(() -> new ResourceNotFoundException("UserMission not found with id: " + userMissionId));
        
        userMission.setCurrentProgress(progress);
        if (progress >= userMission.getMission().getTargetValue()) {
            userMission.setIsCompleted(true);
            userMission.setCompletedAt(LocalDateTime.now());
        }
        return userMissionRepository.save(userMission);
    }

    public UserMission claimReward(Long userMissionId) {
        UserMission userMission = userMissionRepository.findById(userMissionId)
                .orElseThrow(() -> new ResourceNotFoundException("UserMission not found with id: " + userMissionId));
        
        if (!userMission.getIsCompleted()) {
            throw new IllegalStateException("Mission not completed yet");
        }
        if (userMission.getRewardClaimed()) {
            throw new IllegalStateException("Reward already claimed");
        }
        
        userMission.setRewardClaimed(true);
        userMission.setRewardClaimedAt(LocalDateTime.now());
        return userMissionRepository.save(userMission);
    }

    public void deleteMission(Long id) {
        Mission mission = getMissionById(id);
        mission.setIsActive(false);
        missionRepository.save(mission);
    }
}
