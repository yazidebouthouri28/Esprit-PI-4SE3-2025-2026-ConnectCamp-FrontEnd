package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Coupon;
import tn.esprit.projetintegre.exception.DuplicateResourceException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.CouponRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByIsActiveTrue();
    }

    public List<Coupon> getValidCoupons() {
        return couponRepository.findValidCoupons(LocalDateTime.now());
    }

    public Coupon getCouponById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    public Coupon getCouponByCode(String code) {
        return couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + code));
    }

    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        normalizeCoupon(coupon);
        if (couponRepository.existsByCode(coupon.getCode())) {
            throw new DuplicateResourceException("Coupon code already exists");
        }
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon updateCoupon(Long id, Coupon couponDetails) {
        Coupon coupon = getCouponById(id);

        if (couponDetails.getDescription() != null) coupon.setDescription(couponDetails.getDescription());
        if (couponDetails.getType() != null) coupon.setType(couponDetails.getType());
        if (couponDetails.getDiscountValue() != null) coupon.setDiscountValue(couponDetails.getDiscountValue());
        if (couponDetails.getMinOrderAmount() != null) coupon.setMinOrderAmount(couponDetails.getMinOrderAmount());
        if (couponDetails.getMaxDiscountAmount() != null) coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
        if (couponDetails.getUsageLimit() != null) coupon.setUsageLimit(couponDetails.getUsageLimit());
        if (couponDetails.getUsageLimitPerUser() != null) coupon.setUsageLimitPerUser(couponDetails.getUsageLimitPerUser());
        if (couponDetails.getValidFrom() != null) coupon.setValidFrom(couponDetails.getValidFrom());
        if (couponDetails.getValidUntil() != null) coupon.setValidUntil(couponDetails.getValidUntil());
        if (couponDetails.getIsActive() != null) coupon.setIsActive(couponDetails.getIsActive());
        if (couponDetails.getIsFirstOrderOnly() != null) coupon.setIsFirstOrderOnly(couponDetails.getIsFirstOrderOnly());

        normalizeCoupon(coupon);
        return couponRepository.save(coupon);
    }

    public BigDecimal calculateDiscount(String code, BigDecimal orderAmount) {
        Coupon coupon = getCouponByCode(code);

        if (!coupon.isValid()) {
            throw new IllegalStateException("Coupon is not valid");
        }

        if (coupon.getMinOrderAmount() != null &&
                orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalStateException("Order amount is below minimum required");
        }

        BigDecimal discount;
        switch (coupon.getType()) {
            case PERCENTAGE:
                discount = orderAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                break;
            case FIXED_AMOUNT:
                discount = coupon.getDiscountValue();
                break;
            default:
                discount = BigDecimal.ZERO;
        }

        if (coupon.getMaxDiscountAmount() != null &&
                discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
            discount = coupon.getMaxDiscountAmount();
        }

        return discount;
    }

    @Transactional
    public void useCoupon(String code) {
        Coupon coupon = getCouponByCode(code);
        coupon.setUsageCount((coupon.getUsageCount() != null ? coupon.getUsageCount() : 0) + 1);
        couponRepository.save(coupon);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = getCouponById(id);
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }

    private void normalizeCoupon(Coupon coupon) {
        if (coupon.getCode() != null) {
            coupon.setCode(coupon.getCode().trim().toUpperCase());
        }
        if (coupon.getType() == null) {
            coupon.setType(tn.esprit.projetintegre.enums.PromotionType.PERCENTAGE);
        }
        if (coupon.getDiscountValue() == null) {
            coupon.setDiscountValue(BigDecimal.ZERO);
        }
        if (coupon.getMinOrderAmount() == null) {
            coupon.setMinOrderAmount(BigDecimal.ZERO);
        }
        if (coupon.getMaxDiscountAmount() == null) {
            coupon.setMaxDiscountAmount(BigDecimal.ZERO);
        }
        if (coupon.getUsageCount() == null) {
            coupon.setUsageCount(0);
        }
        if (coupon.getUsageLimitPerUser() == null) {
            coupon.setUsageLimitPerUser(1);
        }
        if (coupon.getIsActive() == null) {
            coupon.setIsActive(true);
        }
        if (coupon.getIsFirstOrderOnly() == null) {
            coupon.setIsFirstOrderOnly(false);
        }
    }
}
