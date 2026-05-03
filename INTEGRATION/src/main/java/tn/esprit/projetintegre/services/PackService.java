package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.PackDTO;
import tn.esprit.projetintegre.entities.Pack;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.CampingService;
import tn.esprit.projetintegre.enums.PackType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.PackRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.CampingServiceRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PackService {

    private final PackRepository packRepository;
    private final SiteRepository siteRepository;
    private final CampingServiceRepository campingServiceRepository;

    public PackDTO.Response createPack(PackDTO.CreateRequest request) {
        Pack pack = Pack.builder()
                .name(request.getName())
                .description(request.getDescription())
                .packType(request.getPackType())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .durationDays(request.getDurationDays())
                .maxPersons(request.getMaxPersons())
                .image(request.getImage())
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .features(request.getFeatures() != null ? request.getFeatures() : new ArrayList<>())
                .inclusions(request.getInclusions() != null ? request.getInclusions() : new ArrayList<>())
                .exclusions(request.getExclusions() != null ? request.getExclusions() : new ArrayList<>())
                .isActive(true)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .isLimitedOffer(request.getIsLimitedOffer() != null ? request.getIsLimitedOffer() : false)
                .availableQuantity(request.getAvailableQuantity())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .services(new ArrayList<>())
                .build();

        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site non trouvé avec l'ID: " + request.getSiteId()));
            pack.setSite(site);
        }

        if (request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            List<CampingService> services = campingServiceRepository.findAllById(request.getServiceIds());
            pack.setServices(services);
        }

        pack = packRepository.save(pack);
        return toResponse(pack);
    }

    @Transactional(readOnly = true)
    public PackDTO.Response getById(Long id) {
        Pack pack = packRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack non trouvé avec l'ID: " + id));
        return toResponse(pack);
    }

    @Transactional(readOnly = true)
    public Page<PackDTO.Response> getAllActive(Pageable pageable) {
        return packRepository.findByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PackDTO.Response> getByType(PackType type, Pageable pageable) {
        return packRepository.findByPackType(type, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PackDTO.Response> getBySiteId(Long siteId, Pageable pageable) {
        return packRepository.findBySiteId(siteId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PackDTO.Response> getFeaturedPacks() {
        return packRepository.findFeaturedPacks().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<PackDTO.Response> searchPacks(String keyword, Pageable pageable) {
        return packRepository.searchPacks(keyword, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PackDTO.Response> getByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return packRepository.findByPriceRange(minPrice, maxPrice, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PackDTO.Response> getTopSellingPacks(int limit) {
        return packRepository.findTopSellingPacks(PageRequest.of(0, limit)).stream().map(this::toResponse).toList();
    }

    public PackDTO.Response updatePack(Long id, PackDTO.UpdateRequest request) {
        Pack pack = packRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack non trouvé avec l'ID: " + id));

        if (request.getName() != null) pack.setName(request.getName());
        if (request.getDescription() != null) pack.setDescription(request.getDescription());
        if (request.getPackType() != null) pack.setPackType(request.getPackType());
        if (request.getPrice() != null) pack.setPrice(request.getPrice());
        if (request.getOriginalPrice() != null) pack.setOriginalPrice(request.getOriginalPrice());
        if (request.getDurationDays() != null) pack.setDurationDays(request.getDurationDays());
        if (request.getMaxPersons() != null) pack.setMaxPersons(request.getMaxPersons());
        if (request.getImage() != null) pack.setImage(request.getImage());
        if (request.getImages() != null) pack.setImages(request.getImages());
        if (request.getFeatures() != null) pack.setFeatures(request.getFeatures());
        if (request.getInclusions() != null) pack.setInclusions(request.getInclusions());
        if (request.getExclusions() != null) pack.setExclusions(request.getExclusions());
        if (request.getIsActive() != null) pack.setIsActive(request.getIsActive());
        if (request.getIsFeatured() != null) pack.setIsFeatured(request.getIsFeatured());
        if (request.getIsLimitedOffer() != null) pack.setIsLimitedOffer(request.getIsLimitedOffer());
        if (request.getAvailableQuantity() != null) pack.setAvailableQuantity(request.getAvailableQuantity());
        if (request.getValidFrom() != null) pack.setValidFrom(request.getValidFrom());
        if (request.getValidUntil() != null) pack.setValidUntil(request.getValidUntil());

        pack = packRepository.save(pack);
        return toResponse(pack);
    }

    public void deletePack(Long id) {
        Pack pack = packRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pack non trouvé avec l'ID: " + id));
        pack.setIsActive(false);
        packRepository.save(pack);
    }

    private PackDTO.Response toResponse(Pack pack) {
        return PackDTO.Response.builder()
                .id(pack.getId())
                .name(pack.getName())
                .description(pack.getDescription())
                .packType(pack.getPackType())
                .price(pack.getPrice())
                .originalPrice(pack.getOriginalPrice())
                .discountPercentage(pack.getDiscountPercentage())
                .durationDays(pack.getDurationDays())
                .maxPersons(pack.getMaxPersons())
                .image(pack.getImage())
                .images(pack.getImages())
                .features(pack.getFeatures())
                .inclusions(pack.getInclusions())
                .exclusions(pack.getExclusions())
                .isActive(pack.getIsActive())
                .isFeatured(pack.getIsFeatured())
                .isLimitedOffer(pack.getIsLimitedOffer())
                .availableQuantity(pack.getAvailableQuantity())
                .soldCount(pack.getSoldCount())
                .rating(pack.getRating())
                .reviewCount(pack.getReviewCount())
                .validFrom(pack.getValidFrom())
                .validUntil(pack.getValidUntil())
                .siteId(pack.getSite() != null ? pack.getSite().getId() : null)
                .siteName(pack.getSite() != null ? pack.getSite().getName() : null)
                .createdAt(pack.getCreatedAt())
                .build();
    }
}
