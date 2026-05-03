package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.RouteGuide;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteGuideRepository extends JpaRepository<RouteGuide, Long> {

    @Override
    @EntityGraph(attributePaths = {"virtualTour"})
    Optional<RouteGuide> findById(Long id);

    @EntityGraph(attributePaths = {"virtualTour"})
    List<RouteGuide> findByVirtualTourId(Long virtualTourId);

    @EntityGraph(attributePaths = {"virtualTour", "virtualTour.site"})
    List<RouteGuide> findByVirtualTour_Site_Id(Long siteId);

    @EntityGraph(attributePaths = {"virtualTour", "virtualTour.site"})
    List<RouteGuide> findByVirtualTour_Site_CityIgnoreCase(String city);

    @EntityGraph(attributePaths = {"virtualTour"})
    List<RouteGuide> findByIsActive(Boolean isActive);
}
