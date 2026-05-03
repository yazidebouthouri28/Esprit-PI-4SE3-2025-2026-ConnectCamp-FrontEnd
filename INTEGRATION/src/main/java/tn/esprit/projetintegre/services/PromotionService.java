package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Promotion;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.PromotionRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Page<Promotion> getAllPromotions(Pageable pageable) {
        return promotionRepository.findAll(pageable);
    }

    public Promotion getPromotionById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id: " + id));
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByIsActiveTrue();
    }

    public List<Promotion> getValidPromotions() {
        return promotionRepository.findActivePromotions(java.time.LocalDateTime.now());
    }

    public Promotion createPromotion(Promotion promotion) {
        promotion.setIsActive(true);
        promotion.setCurrentUsage(0);
        return promotionRepository.save(promotion);
    }

    public Promotion updatePromotion(Long id, Promotion promotionDetails) {
        Promotion promotion = getPromotionById(id);
        promotion.setName(promotionDetails.getName());
        promotion.setDescription(promotionDetails.getDescription());
        promotion.setType(promotionDetails.getType());
        promotion.setDiscountValue(promotionDetails.getDiscountValue());
        promotion.setMinPurchaseAmount(promotionDetails.getMinPurchaseAmount());
        promotion.setMaxDiscountAmount(promotionDetails.getMaxDiscountAmount());
        promotion.setMaxUsage(promotionDetails.getMaxUsage());
        promotion.setStartDate(promotionDetails.getStartDate());
        promotion.setEndDate(promotionDetails.getEndDate());
          promotion.setTargetAudience(promotionDetails.getTargetAudience());
        return promotionRepository.save(promotion);
    }

    public Promotion activatePromotion(Long id) {
        Promotion promotion = getPromotionById(id);
        promotion.setIsActive(true);
        return promotionRepository.save(promotion);
    }

    public Promotion deactivatePromotion(Long id) {
        Promotion promotion = getPromotionById(id);
        promotion.setIsActive(false);
        return promotionRepository.save(promotion);
    }

    public Promotion incrementUsage(Long id) {
        Promotion promotion = getPromotionById(id);
        if (promotion.getMaxUsage() != null && promotion.getCurrentUsage() >= promotion.getMaxUsage()) {
            throw new IllegalStateException("Promotion has reached maximum usage");
        }
        promotion.setCurrentUsage(promotion.getCurrentUsage() + 1);
        return promotionRepository.save(promotion);
    }

    public void deletePromotion(Long id) {
        Promotion promotion = getPromotionById(id);
        promotion.setIsActive(false);
        promotionRepository.save(promotion);
    }


}
