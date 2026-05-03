package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.CampsiteCreateRequest;
import tn.esprit.projetintegre.entities.Campsite;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.CampsiteRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampsiteService {
    private final CampsiteRepository campsiteRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    public List<Campsite> getAll() {
        return campsiteRepository.findAll();
    }

    @Transactional
    public Campsite create(CampsiteCreateRequest request, Authentication authentication) {
        User owner = resolveOwner(request.getOwnerId(), authentication);

        Site site = Site.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .capacity(request.getCapacity())
                .pricePerNight(request.getPricePerNight())
                .amenities(request.getAmenities() != null ? request.getAmenities() : List.of())
                .images(request.getImages() != null ? request.getImages() : List.of())
                .isActive(true)
                .owner(owner)
                .build();

        Site savedSite = siteRepository.save(site);

        Campsite campsite = Campsite.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 2)
                .pricePerNight(request.getPricePerNight())
                .amenities(request.getAmenities() != null ? request.getAmenities() : List.of())
                .images(request.getImages() != null ? request.getImages() : List.of())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isAvailable(true)
                .isActive(true)
                .site(savedSite)
                .build();

        return campsiteRepository.save(campsite);
    }

    private User resolveOwner(Long ownerId, Authentication authentication) {
        if (ownerId != null) {
            return userRepository.findById(ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        }
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Owner not found");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
    }
}

