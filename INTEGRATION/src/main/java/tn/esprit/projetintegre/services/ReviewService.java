package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Product;
import tn.esprit.projetintegre.entities.ProductReview;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ProductRepository;
import tn.esprit.projetintegre.repositories.ProductReviewRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Page<ProductReview> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    public ProductReview getReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
    }

    public Page<ProductReview> getReviewsByProductId(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable);
    }

    public Page<ProductReview> getReviewsByUserId(Long userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable);
    }

    public ProductReview createReview(ProductReview review, Long productId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Check if user already reviewed this product
        if (reviewRepository.findByProductIdAndUserId(productId, userId).isPresent()) {
            throw new IllegalStateException("User has already reviewed this product");
        }

        review.setProduct(product);
        review.setUser(user);
        review.setIsApproved(true); // Auto-approve or set to false for moderation
        
        ProductReview savedReview = reviewRepository.save(review);
        updateProductRating(productId);
        return savedReview;
    }

    public ProductReview updateReview(Long id, ProductReview reviewDetails) {
        ProductReview review = getReviewById(id);
        review.setRating(reviewDetails.getRating());
        review.setTitle(reviewDetails.getTitle());
        review.setComment(reviewDetails.getComment());
        review.setImages(reviewDetails.getImages());
        
        ProductReview savedReview = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());
        return savedReview;
    }

    public ProductReview approveReview(Long id) {
        ProductReview review = getReviewById(id);
        review.setIsApproved(true);
        return reviewRepository.save(review);
    }

    public void deleteReview(Long id) {
        ProductReview review = getReviewById(id);
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        updateProductRating(productId);
    }

    private void updateProductRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        
        Double avgRating = reviewRepository.getAverageRatingForProduct(productId);
        long reviewCount = reviewRepository.countByProductIdAndIsApprovedTrue(productId);
        
        product.setRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        product.setReviewCount((int) reviewCount);
        productRepository.save(product);
    }
}
