package tn.esprit.projetintegre.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.projetintegre.dto.request.*;
import tn.esprit.projetintegre.dto.response.*;
import tn.esprit.projetintegre.entities.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SiteModuleMapper {

    // ----------- SITE -----------
    public Site toEntity(SiteRequest request) {
        if (request == null)
            return null;
        List<String> images = request.getImages() != null ? request.getImages() : new java.util.ArrayList<>();
        String thumbnail = images.isEmpty() ? null : images.get(0);
        return Site.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .address(request.getAddress())
                .city(request.getCity()) // Wait, getter is getCity()
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .capacity(request.getCapacity())
                .pricePerNight(request.getPricePerNight())
                .images(images)
                .thumbnail(thumbnail)
                .amenities(request.getAmenities() != null ? request.getAmenities() : new java.util.ArrayList<>())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public SiteResponse toResponse(Site entity) {
        if (entity == null)
            return null;
        return SiteResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .type(entity.getType())
                .address(entity.getAddress())
                .city(entity.getCity())
                .country(entity.getCountry())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .capacity(entity.getCapacity())
                .pricePerNight(entity.getPricePerNight())
                .images(entity.getImages())
                .amenities(entity.getAmenities())
                .contactPhone(entity.getContactPhone())
                .contactEmail(entity.getContactEmail())
                .isActive(entity.getIsActive())
                .rating(entity.getRating()) // averageRating directly mapped to rating
                .reviewCount(entity.getReviewCount())
                // No owner mapping here as owner might be User entity not exposed like this yet
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<SiteResponse> toSiteResponseList(List<Site> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SiteSummaryResponse toSummaryResponse(Site entity) {
        if (entity == null)
            return null;
        return SiteSummaryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .type(entity.getType())
                .address(entity.getAddress())
                .city(entity.getCity())
                .country(entity.getCountry())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .capacity(entity.getCapacity())
                .pricePerNight(entity.getPricePerNight())
                .image(entity.getThumbnail())
                .amenities(entity.getAmenities())
                .isActive(entity.getIsActive())
                .rating(entity.getRating())
                .reviewCount(entity.getReviewCount())
                .build();
    }

    public List<SiteSummaryResponse> toSiteSummaryResponseList(List<Site> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toSummaryResponse).collect(Collectors.toList());
    }

    public void updateEntity(Site entity, SiteRequest request) {
        if (request == null || entity == null)
            return;
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setAddress(request.getAddress());
        entity.setCity(request.getCity());
        entity.setCountry(request.getCountry());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setCapacity(request.getCapacity());
        entity.setPricePerNight(request.getPricePerNight());
        if (request.getImages() != null) {
            entity.setImages(request.getImages());
            entity.setThumbnail(request.getImages().isEmpty() ? null : request.getImages().get(0));
        }
        if (request.getAmenities() != null)
            entity.setAmenities(request.getAmenities());
        entity.setContactPhone(request.getContactPhone());
        entity.setContactEmail(request.getContactEmail());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());
    }

    // ----------- VIRTUAL TOUR -----------
    public VirtualTour toEntity(VirtualTourRequest request, Site site) {
        if (request == null)
            return null;
        return VirtualTour.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .durationMinutes(request.getDurationMinutes())
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .site(site)
                .build();
    }

    public void updateEntity(VirtualTour entity, VirtualTourRequest request) {
        if (request == null || entity == null)
            return;
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setThumbnailUrl(request.getThumbnailUrl());
        entity.setDurationMinutes(request.getDurationMinutes());
        if (request.getIsFeatured() != null)
            entity.setIsFeatured(request.getIsFeatured());
    }

    public VirtualTourResponse toResponse(VirtualTour entity) {
        if (entity == null)
            return null;
        return VirtualTourResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .thumbnailUrl(entity.getThumbnailUrl())
                .durationMinutes(entity.getDurationMinutes())
                .viewCount(entity.getViewCount())
                .isActive(entity.getIsActive())
                .isFeatured(entity.getIsFeatured())
                .siteId(entity.getSite() != null ? entity.getSite().getId() : null)
                .siteName(entity.getSite() != null ? entity.getSite().getName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<VirtualTourResponse> toVirtualTourResponseList(List<VirtualTour> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- SCENE 360 -----------
    public Scene360 toEntity(Scene360Request request, VirtualTour tour) {
        if (request == null)
            return null;
        return Scene360.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .initialYaw(request.getInitialYaw())
                .initialPitch(request.getInitialPitch())
                .initialFov(request.getInitialFov() != null ? request.getInitialFov() : 90)
                .hotspots(request.getHotspots() != null ? request.getHotspots() : new java.util.ArrayList<>())
                .virtualTour(tour)
                .build();
    }

    public void updateEntity(Scene360 entity, Scene360Request request) {
        if (request == null || entity == null)
            return;
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setImageUrl(request.getImageUrl());
        entity.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getOrderIndex() != null)
            entity.setOrderIndex(request.getOrderIndex());
        entity.setInitialYaw(request.getInitialYaw());
        entity.setInitialPitch(request.getInitialPitch());
        if (request.getInitialFov() != null)
            entity.setInitialFov(request.getInitialFov());
        if (request.getHotspots() != null)
            entity.setHotspots(request.getHotspots());
    }

    public Scene360Response toResponse(Scene360 entity) {
        if (entity == null)
            return null;
        return Scene360Response.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .thumbnailUrl(entity.getThumbnailUrl())
                .orderIndex(entity.getOrderIndex())
                .initialYaw(entity.getInitialYaw())
                .initialPitch(entity.getInitialPitch())
                .initialFov(entity.getInitialFov())
                .hotspots(entity.getHotspots())
                .build();
    }

    public List<Scene360Response> toScene360ResponseList(List<Scene360> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- ROUTE GUIDE -----------
    public RouteGuide toEntity(RouteGuideRequest request, Site site, VirtualTour tour) {
        if (request == null)
            return null;
        return RouteGuide.builder()
                .name(request.getName())
                .description(request.getDescription())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .difficulty(request.getDifficulty())
                .waypoints(request.getWaypoints() != null ? request.getWaypoints() : new java.util.ArrayList<>())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .virtualTour(tour)
                .build();
    }

    public void updateEntity(RouteGuide entity, RouteGuideRequest request, VirtualTour tour) {
        if (request == null || entity == null)
            return;
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        entity.setDifficulty(request.getDifficulty());
        if (request.getWaypoints() != null)
            entity.setWaypoints(request.getWaypoints());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());
        entity.setVirtualTour(tour);
    }

    public RouteGuideResponse toResponse(RouteGuide entity) {
        if (entity == null)
            return null;
        return RouteGuideResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .estimatedDurationMinutes(entity.getEstimatedDurationMinutes())
                .distanceMeters(entity.getDistanceMeters())
                .difficulty(entity.getDifficulty())
                .sceneOrder(entity.getSceneOrder())
                .waypoints(entity.getWaypoints())
                .isActive(entity.getIsActive())
                .virtualTourId(entity.getVirtualTour() != null ? entity.getVirtualTour().getId() : null)
                .build();
    }

    public List<RouteGuideResponse> toRouteGuideResponseList(List<RouteGuide> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- REVIEW -----------
    public Review toEntity(ReviewRequest request, Site site) {
        if (request == null)
            return null;
        return Review.builder()
                .targetType(tn.esprit.projetintegre.enums.ReviewTargetType.SITE)
                .targetId(site != null ? site.getId() : request.getTargetId())
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .images(request.getImages() != null ? request.getImages() : new java.util.ArrayList<>())
                .build();
    }

    public void updateEntity(Review entity, ReviewRequest request) {
        if (request == null || entity == null)
            return;
        entity.setRating(request.getRating());
        entity.setTitle(request.getTitle());
        entity.setComment(request.getComment());
        if (request.getImages() != null)
            entity.setImages(request.getImages());
    }

    public ReviewResponse toResponse(Review entity) {
        if (entity == null)
            return null;
        return ReviewResponse.builder()
                .id(entity.getId())
                .rating(entity.getRating())
                .title(entity.getTitle())
                .comment(entity.getComment())
                .images(entity.getImages())
                .likesCount(entity.getLikesCount())
                .verified(entity.getVerified())
                .approved(entity.getApproved())
                .response(entity.getResponse())
                .respondedAt(entity.getRespondedAt())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .userName(entity.getUser() != null
                        ? (entity.getUser().getName() != null && !entity.getUser().getName().isBlank()
                                ? entity.getUser().getName()
                                : entity.getUser().getUsername())
                        : null)
                .userAvatar(entity.getUser() != null ? entity.getUser().getAvatar() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<ReviewResponse> toReviewResponseList(List<Review> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- CERTIFICATION -----------
    public Certification toEntity(CertificationRequest request, Site site) {
        if (request == null)
            return null;
        return Certification.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .issuingOrganization(request.getIssuingOrganization())
                .issueDate(request.getIssueDate())
                .expirationDate(request.getExpirationDate())
                .documentUrl(request.getDocumentUrl())
                .verificationUrl(request.getVerificationUrl())
                .score(request.getScore())
                // Need a unique code strategy, we do it in service
                .build();
    }

    public void updateEntity(Certification entity, CertificationRequest request) {
        if (request == null || entity == null)
            return;
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setIssuingOrganization(request.getIssuingOrganization());
        entity.setIssueDate(request.getIssueDate());
        entity.setExpirationDate(request.getExpirationDate());
        entity.setDocumentUrl(request.getDocumentUrl());
        entity.setVerificationUrl(request.getVerificationUrl());
        entity.setScore(request.getScore());
    }

    public CertificationResponse toResponse(Certification entity) {
        if (entity == null)
            return null;
        return CertificationResponse.builder()
                .id(entity.getId())
                .certificationCode(entity.getCertificationCode())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .issuingOrganization(entity.getIssuingOrganization())
                .issueDate(entity.getIssueDate())
                .expirationDate(entity.getExpirationDate())
                .status(entity.getStatus())
                .documentUrl(entity.getDocumentUrl())
                .verificationUrl(entity.getVerificationUrl())
                .score(entity.getScore())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null) // Using siteId as userId in
                                                                                    // response due to generic naming
                .items(toCertificationItemResponseList(entity.getItems()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<CertificationResponse> toCertificationResponseList(List<Certification> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- CERTIFICATION ITEM -----------
    public CertificationItem toEntity(CertificationItemRequest request, Certification certification) {
        if (request == null)
            return null;
        return CertificationItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .score(request.getScore())
                .requiredScore(request.getRequiredScore())
                .passed(request.getPassed() != null ? request.getPassed() : false)
                .completedAt(request.getCompletedAt())
                .certification(certification)
                .build();
    }

    public void updateEntity(CertificationItem entity, CertificationItemRequest request) {
        if (request == null || entity == null)
            return;
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setScore(request.getScore());
        entity.setRequiredScore(request.getRequiredScore());
        if (request.getPassed() != null)
            entity.setPassed(request.getPassed());
        entity.setCompletedAt(request.getCompletedAt());
    }

    public CertificationItemResponse toResponse(CertificationItem entity) {
        if (entity == null)
            return null;
        return CertificationItemResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .score(entity.getScore())
                .requiredScore(entity.getRequiredScore())
                .passed(entity.getPassed())
                .completedAt(entity.getCompletedAt())
                .certificationId(entity.getCertification() != null ? entity.getCertification().getId() : null)
                .build();
    }

    public List<CertificationItemResponse> toCertificationItemResponseList(List<CertificationItem> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ----------- CAMP HIGHLIGHT -----------
    public CampHighlight toEntity(CampHighlightRequest request, Site site) {
        if (request == null)
            return null;
        return CampHighlight.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : true)
                .site(site)
                .build();
    }

    public void updateEntity(CampHighlight entity, CampHighlightRequest request) {
        if (request == null || entity == null)
            return;
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        entity.setCategory(request.getCategory());
        entity.setImageUrl(request.getImageUrl());
        if (request.getIsPublished() != null)
            entity.setIsPublished(request.getIsPublished());
    }

    public CampHighlightResponse toResponse(CampHighlight entity) {
        if (entity == null)
            return null;
        return CampHighlightResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .category(entity.getCategory())
                .imageUrl(entity.getImageUrl())
                .isPublished(entity.getIsPublished())
                .siteId(entity.getSite() != null ? entity.getSite().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<CampHighlightResponse> toCampHighlightResponseList(List<CampHighlight> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
