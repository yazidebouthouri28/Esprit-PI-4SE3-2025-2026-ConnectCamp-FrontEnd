package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Achievement;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.UserAchievement;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.AchievementRepository;
import tn.esprit.projetintegre.repositories.UserAchievementRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;

    public List<Achievement> getAllAchievements() {
        return achievementRepository.findAll();
    }

    public Page<Achievement> getAllAchievements(Pageable pageable) {
        return achievementRepository.findAll(pageable);
    }

    public Achievement getAchievementById(Long id) {
        return achievementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Achievement not found with id: " + id));
    }

    public List<Achievement> getActiveAchievements() {
        return achievementRepository.findByIsActiveTrue();
    }

    public List<Achievement> getAchievementsByCategory(String category) {
        return achievementRepository.findByCategory(category);
    }

    public Achievement createAchievement(Achievement achievement) {
        achievement.setIsActive(true);
        return achievementRepository.save(achievement);
    }

    public Achievement updateAchievement(Long id, Achievement achievementDetails) {
        Achievement achievement = getAchievementById(id);
        achievement.setName(achievementDetails.getName());
        achievement.setDescription(achievementDetails.getDescription());
        achievement.setBadge(achievementDetails.getBadge());
        achievement.setIcon(achievementDetails.getIcon());
        achievement.setRequiredPoints(achievementDetails.getRequiredPoints());
        achievement.setRewardPoints(achievementDetails.getRewardPoints());
        achievement.setCategory(achievementDetails.getCategory());
        achievement.setLevel(achievementDetails.getLevel());
        return achievementRepository.save(achievement);
    }

    public UserAchievement unlockAchievement(Long achievementId, Long userId) {
        Achievement achievement = getAchievementById(achievementId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievementId)) {
            throw new IllegalStateException("Achievement already unlocked");
        }

        UserAchievement userAchievement = UserAchievement.builder()
                .achievement(achievement)
                .user(user)
                .unlockedAt(LocalDateTime.now())
                .isDisplayed(true)
                .build();

        return userAchievementRepository.save(userAchievement);
    }

    public List<UserAchievement> getUserAchievements(Long userId) {
        return userAchievementRepository.findByUserId(userId);
    }

    public List<UserAchievement> getDisplayedAchievements(Long userId) {
        return userAchievementRepository.findByUserIdAndIsDisplayedTrue(userId);
    }

    public UserAchievement toggleDisplay(Long userAchievementId) {
        UserAchievement userAchievement = userAchievementRepository.findById(userAchievementId)
                .orElseThrow(() -> new ResourceNotFoundException("UserAchievement not found with id: " + userAchievementId));
        userAchievement.setIsDisplayed(!userAchievement.getIsDisplayed());
        return userAchievementRepository.save(userAchievement);
    }

    public void deleteAchievement(Long id) {
        Achievement achievement = getAchievementById(id);
        achievement.setIsActive(false);
        achievementRepository.save(achievement);
    }
}
