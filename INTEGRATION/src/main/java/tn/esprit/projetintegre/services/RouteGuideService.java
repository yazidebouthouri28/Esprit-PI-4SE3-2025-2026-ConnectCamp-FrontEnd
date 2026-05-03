package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.projetintegre.dto.request.RouteGuideRequest;
import tn.esprit.projetintegre.dto.response.RouteGuideResponse;
import tn.esprit.projetintegre.entities.RouteGuide;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.VirtualTour;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.RouteGuideRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.VirtualTourRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteGuideService {

    private final RouteGuideRepository routeGuideRepository;
    private final SiteRepository siteRepository;
    private final VirtualTourRepository virtualTourRepository;
    private final SiteModuleMapper siteMapper;

    public List<RouteGuideResponse> getRoutesBySite(Long siteId) {
        return siteMapper.toRouteGuideResponseList(routeGuideRepository.findByVirtualTour_Site_Id(siteId));
    }

    public List<RouteGuideResponse> getRoutesByOriginCity(String city) {
        return siteMapper.toRouteGuideResponseList(routeGuideRepository.findByVirtualTour_Site_CityIgnoreCase(city));
    }

    public RouteGuideResponse getRouteById(Long id) {
        RouteGuide route = routeGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RouteGuide not found"));
        return siteMapper.toResponse(route);
    }

    public RouteGuideResponse createRoute(Long siteId, RouteGuideRequest request) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        VirtualTour tour = null;
        if (request.getVirtualTourId() != null) {
            tour = virtualTourRepository.findById(request.getVirtualTourId())
                    .orElseThrow(() -> new RuntimeException("VirtualTour not found"));
        }

        RouteGuide route = siteMapper.toEntity(request, site, tour);
        return siteMapper.toResponse(routeGuideRepository.save(route));
    }

    public RouteGuideResponse updateRoute(Long id, RouteGuideRequest request) {
        RouteGuide existing = routeGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RouteGuide not found"));

        VirtualTour tour = existing.getVirtualTour();
        if (request.getVirtualTourId() != null && (tour == null || !tour.getId().equals(request.getVirtualTourId()))) {
            tour = virtualTourRepository.findById(request.getVirtualTourId())
                    .orElseThrow(() -> new RuntimeException("VirtualTour not found"));
        }

        siteMapper.updateEntity(existing, request, tour);
        return siteMapper.toResponse(routeGuideRepository.save(existing));
    }

    public void deleteRoute(Long id) {
        routeGuideRepository.deleteById(id);
    }
}
