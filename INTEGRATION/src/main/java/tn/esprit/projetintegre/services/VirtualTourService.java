package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.projetintegre.dto.request.VirtualTourRequest;
import tn.esprit.projetintegre.dto.response.VirtualTourResponse;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.VirtualTour;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.VirtualTourRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VirtualTourService {

    private final VirtualTourRepository virtualTourRepository;
    private final SiteRepository siteRepository;
    private final SiteModuleMapper siteMapper;

    public List<VirtualTourResponse> getToursBySite(Long siteId) {
        return siteMapper.toVirtualTourResponseList(virtualTourRepository.findBySiteId(siteId));
    }

    public VirtualTourResponse getTourById(Long id) {
        VirtualTour tour = virtualTourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VirtualTour not found"));
        return siteMapper.toResponse(tour);
    }

    public VirtualTourResponse createTour(Long siteId, VirtualTourRequest request) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        VirtualTour tour = siteMapper.toEntity(request, site);
        return siteMapper.toResponse(virtualTourRepository.save(tour));
    }

    public VirtualTourResponse updateTour(Long id, VirtualTourRequest request) {
        VirtualTour existing = virtualTourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VirtualTour not found"));
        siteMapper.updateEntity(existing, request);
        return siteMapper.toResponse(virtualTourRepository.save(existing));
    }

    public void deleteTour(Long id) {
        virtualTourRepository.deleteById(id);
    }
}
