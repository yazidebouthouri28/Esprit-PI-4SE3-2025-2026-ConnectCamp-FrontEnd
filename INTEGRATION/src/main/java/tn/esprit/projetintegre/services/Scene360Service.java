package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.projetintegre.dto.request.Scene360Request;
import tn.esprit.projetintegre.dto.response.Scene360Response;
import tn.esprit.projetintegre.entities.Scene360;
import tn.esprit.projetintegre.entities.VirtualTour;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.Scene360Repository;
import tn.esprit.projetintegre.repositories.VirtualTourRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class Scene360Service {

    private final Scene360Repository scene360Repository;
    private final VirtualTourRepository virtualTourRepository;
    private final SiteModuleMapper siteMapper;

    public List<Scene360Response> getScenesByTour(Long tourId) {
        return siteMapper
                .toScene360ResponseList(scene360Repository.findByVirtualTourIdOrderByOrderIndexAsc(tourId));
    }

    public Scene360Response addScene(Long tourId, Scene360Request request) {
        VirtualTour tour = virtualTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("VirtualTour not found"));
        Scene360 scene = siteMapper.toEntity(request, tour);
        return siteMapper.toResponse(scene360Repository.save(scene));
    }

    public Scene360Response updateScene(Long sceneId, Scene360Request request) {
        Scene360 existing = scene360Repository.findById(sceneId)
                .orElseThrow(() -> new RuntimeException("Scene not found"));
        siteMapper.updateEntity(existing, request);
        return siteMapper.toResponse(scene360Repository.save(existing));
    }

    public void deleteScene(Long sceneId) {
        scene360Repository.deleteById(sceneId);
    }
}
