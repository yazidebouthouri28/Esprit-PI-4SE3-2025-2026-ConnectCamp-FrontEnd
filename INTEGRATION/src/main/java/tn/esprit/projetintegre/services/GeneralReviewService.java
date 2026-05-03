package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Review;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.ReviewTargetType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ReviewRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GeneralReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public Page<Review> getReviewsByTarget(ReviewTargetType targetType, Long targetId, Pageable pageable) {
        return reviewRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
    }

    public Review createReview(Review review, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Check if user already reviewed this target
        reviewRepository.findByUserIdAndTargetTypeAndTargetId(userId, review.getTargetType(), review.getTargetId())
                .ifPresent(r -> {
                    throw new IllegalStateException("User has already reviewed this " + review.getTargetType());
                });

        review.setUser(user);
        review.setApproved(true); // Default to approved for now
        return reviewRepository.save(review);
    }

    public Review updateReview(Long id, Review reviewDetails) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));

        review.setRating(reviewDetails.getRating());
        review.setTitle(reviewDetails.getTitle());
        review.setComment(reviewDetails.getComment());
        review.setUpdatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Review not found with id: " + id);
        }
        reviewRepository.deleteById(id);
    }

    public Double getAverageRating(ReviewTargetType targetType, Long targetId) {
        Double avg = reviewRepository.getAverageRating(targetType, targetId);
        return avg != null ? avg : 0.0;
    }

    public Long countReviews(ReviewTargetType targetType, Long targetId) {
        return reviewRepository.countApprovedReviews(targetType, targetId);
    }
}
