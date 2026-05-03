package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.projetintegre.dto.request.CampHighlightRequest;
import tn.esprit.projetintegre.dto.response.CampHighlightResponse;
import tn.esprit.projetintegre.entities.CampHighlight;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.enums.HighlightCategory;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.CampHighlightRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampHighlightService {

    private final CampHighlightRepository campHighlightRepository;
    private final SiteRepository siteRepository;
    private final SiteModuleMapper siteMapper;
    private final SiteImageStorageService siteImageStorageService;

    @Transactional(readOnly = true)
    public List<CampHighlightResponse> getAllHighlights() {
        return siteMapper.toCampHighlightResponseList(campHighlightRepository.findAllWithSite());
    }

    @Transactional(readOnly = true)
    public List<CampHighlightResponse> getHighlightsBySite(Long siteId) {
        return siteMapper.toCampHighlightResponseList(campHighlightRepository.findBySite_Id(siteId));
    }

    @Transactional(readOnly = true)
    public List<CampHighlightResponse> getHighlightsBySiteAndCategory(Long siteId, HighlightCategory category) {
        return siteMapper
                .toCampHighlightResponseList(campHighlightRepository.findBySite_IdAndCategory(siteId, category));
    }

    @Transactional(readOnly = true)
    public CampHighlightResponse getHighlightById(Long id) {
        CampHighlight highlight = campHighlightRepository.findByIdWithSite(id)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        return siteMapper.toResponse(highlight);
    }

    public CampHighlightResponse createHighlight(Long siteId, CampHighlightRequest request) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        CampHighlight highlight = siteMapper.toEntity(request, site);
        return siteMapper.toResponse(campHighlightRepository.save(highlight));
    }

    public CampHighlightResponse updateHighlight(Long id, CampHighlightRequest request) {
        CampHighlight existing = campHighlightRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        String previousMediaUrl = existing.getImageUrl();
        siteMapper.updateEntity(existing, request);
        CampHighlight saved = campHighlightRepository.save(existing);
        if (previousMediaUrl != null && !previousMediaUrl.equals(saved.getImageUrl())) {
            siteImageStorageService.deleteByPublicUrl(previousMediaUrl);
        }
        return siteMapper.toResponse(saved);
    }

    public void deleteHighlight(Long id) {
        CampHighlight existing = campHighlightRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        campHighlightRepository.delete(existing);
        siteImageStorageService.deleteByPublicUrl(existing.getImageUrl());
    }

    public String uploadHighlightMedia(Long siteId, MultipartFile file) {
        siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        return siteImageStorageService.storeHighlightMedia(siteId, file);
    }
}
