package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Subscription;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.SubscriptionStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.SubscriptionRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    public Page<Subscription> getAllSubscriptions(Pageable pageable) {
        return subscriptionRepository.findAll(pageable);
    }

    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));
    }

    public Page<Subscription> getSubscriptionsByUserId(Long userId, Pageable pageable) {
        return subscriptionRepository.findByUserId(userId, pageable);
    }

    public List<Subscription> getActiveSubscriptionsByUserId(Long userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE);
    }

    public List<Subscription> getSubscriptionsByStatus(SubscriptionStatus status) {
        return subscriptionRepository.findByStatus(status);
    }
    // Dans SubscriptionService.java
    public Subscription updateSubscription(Subscription subscription) {
        return subscriptionRepository.save(subscription);
    }

    // Ou avec un ID explicite
    public Subscription updateSubscription(Long id, Subscription subscriptionDetails) {
        Subscription subscription = getSubscriptionById(id);
        // Copier les propriétés
        subscription.setPlanName(subscriptionDetails.getPlanName());
        subscription.setPlanType(subscriptionDetails.getPlanType());
        subscription.setPrice(subscriptionDetails.getPrice());
        subscription.setAutoRenew(subscriptionDetails.getAutoRenew());
        // Ajouter d'autres champs si nécessaire

        return subscriptionRepository.save(subscription);
    }

    public Subscription createSubscription(Subscription subscription, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        subscription.setUser(user);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now());
        if (subscription.getEndDate() == null) {
            subscription.setEndDate(LocalDateTime.now().plusMonths(1));
        }
        return subscriptionRepository.save(subscription);
    }

    public Subscription activateSubscription(Long id) {
        Subscription subscription = getSubscriptionById(id);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        return subscriptionRepository.save(subscription);
    }

    public Subscription cancelSubscription(Long id) {
        Subscription subscription = getSubscriptionById(id);
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        return subscriptionRepository.save(subscription);
    }

    public Subscription suspendSubscription(Long id) {
        Subscription subscription = getSubscriptionById(id);
        subscription.setStatus(SubscriptionStatus.SUSPENDED);
        return subscriptionRepository.save(subscription);
    }

    public Subscription renewSubscription(Long id, int months) {
        Subscription subscription = getSubscriptionById(id);
        subscription.setEndDate(subscription.getEndDate().plusMonths(months));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        return subscriptionRepository.save(subscription);
    }

    public void deleteSubscription(Long id) {
        Subscription subscription = getSubscriptionById(id);
        subscriptionRepository.delete(subscription);
    }
}
