package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final SiteImageStorageService siteImageStorageService;

    @Transactional(readOnly = true)
    public List<Site> getAllSites() {
        return initializeCollections(siteRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<Site> getAllSitesAdmin() {
        return initializeCollections(siteRepository.findAll());
    }

    @Transactional(readOnly = true)
    public Page<Site> getActiveSites(Pageable pageable) {
        Page<Site> sites = siteRepository.findListedActiveSites(pageable);
        initializeCollections(sites.getContent());
        return sites;
    }

    @Transactional(readOnly = true)
    public List<Site> getActiveSites() {
        return initializeCollections(siteRepository.findListedActiveSites());
    }

    @Transactional(readOnly = true)
    public Site getSiteById(Long id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + id));
        return initializeCollections(site);
    }

    @Transactional(readOnly = true)
    public Page<Site> searchSites(String keyword, Pageable pageable) {
        Page<Site> sites = siteRepository.searchSites(keyword, pageable);
        initializeCollections(sites.getContent());
        return sites;
    }

    @Transactional(readOnly = true)
    public Page<Site> getSitesByOwner(Long ownerId, Pageable pageable) {
        Page<Site> sites = siteRepository.findByOwnerId(ownerId, pageable);
        initializeCollections(sites.getContent());
        return sites;
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByCity(String city) {
        return initializeCollections(siteRepository.findByCity(city));
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByType(String type) {
        return initializeCollections(siteRepository.findByType(type));
    }

    @Transactional
    public Site createSite(Site site, Long ownerId) {
        if (ownerId == null) {
            throw new IllegalArgumentException("ownerId is required");
        }
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        site.setOwner(owner);
        if (site.getIsActive() == null) {
            site.setIsActive(true);
        }
        return siteRepository.save(site);
    }

    @Transactional
    public Site updateSite(Long id, Site siteDetails) {
        Site site = getSiteById(id);

        if (siteDetails.getName() != null)
            site.setName(siteDetails.getName());
        if (siteDetails.getDescription() != null)
            site.setDescription(siteDetails.getDescription());
        if (siteDetails.getType() != null)
            site.setType(siteDetails.getType());
        if (siteDetails.getAddress() != null)
            site.setAddress(siteDetails.getAddress());
        if (siteDetails.getCity() != null)
            site.setCity(siteDetails.getCity());
        if (siteDetails.getCountry() != null)
            site.setCountry(siteDetails.getCountry());
        if (siteDetails.getCapacity() != null)
            site.setCapacity(siteDetails.getCapacity());
        if (siteDetails.getPricePerNight() != null)
            site.setPricePerNight(siteDetails.getPricePerNight());
        if (siteDetails.getImages() != null)
            site.setImages(siteDetails.getImages());
        if (siteDetails.getAmenities() != null)
            site.setAmenities(siteDetails.getAmenities());
        if (siteDetails.getContactPhone() != null)
            site.setContactPhone(siteDetails.getContactPhone());
        if (siteDetails.getContactEmail() != null)
            site.setContactEmail(siteDetails.getContactEmail());
        if (siteDetails.getLatitude() != null)
            site.setLatitude(siteDetails.getLatitude());
        if (siteDetails.getLongitude() != null)
            site.setLongitude(siteDetails.getLongitude());
        if (siteDetails.getIsActive() != null)
            site.setIsActive(siteDetails.getIsActive());
        if (siteDetails.getCheckInTime() != null)
            site.setCheckInTime(siteDetails.getCheckInTime());
        if (siteDetails.getCheckOutTime() != null)
            site.setCheckOutTime(siteDetails.getCheckOutTime());
        if (siteDetails.getHouseRules() != null)
            site.setHouseRules(siteDetails.getHouseRules());

        return siteRepository.save(site);
    }

    @Transactional
    public void deleteSite(Long id) {
        Site site = getSiteById(id);
        site.setIsActive(false);
        siteRepository.save(site);
    }

    @Transactional
    public Site appendSiteImages(Long id, List<MultipartFile> files) {
        Site site = getSiteById(id);
        List<String> urls = siteImageStorageService.storeSiteImages(id, files);
        if (urls.isEmpty()) {
            return site;
        }
        List<String> images = new ArrayList<>(site.getImages() != null ? site.getImages() : List.of());
        images.addAll(urls);
        site.setImages(images);
        if ((site.getThumbnail() == null || site.getThumbnail().isBlank()) && !images.isEmpty()) {
            site.setThumbnail(images.get(0));
        }
        return siteRepository.save(site);
    }

    @Transactional
    public Site removeSiteImageByUrl(Long id, String url) {
        Site site = getSiteById(id);
        if (site.getImages() != null) {
            site.getImages().removeIf(u -> u != null && u.equals(url));
        }
        siteImageStorageService.deleteByPublicUrl(url);
        return siteRepository.save(site);
    }

    private Site initializeCollections(Site site) {
        if (site == null) {
            return null;
        }

        if (site.getImages() != null) {
            site.getImages().size();
        }

        if (site.getAmenities() != null) {
            site.getAmenities().size();
        }

        return site;
    }

    private List<Site> initializeCollections(List<Site> sites) {
        for (Site site : sites) {
            initializeCollections(site);
        }
        return sites;
    }
}
