package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.Pack;
import tn.esprit.projetintegre.enums.PackType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PackRepository extends JpaRepository<Pack, Long> {

    @Override
    @EntityGraph(attributePaths = {"site"}) // Charge les relations nécessaires
    Optional<Pack> findById(Long id);

    @EntityGraph(attributePaths = {"site"})
    Page<Pack> findByIsActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    Page<Pack> findByPackType(PackType type, Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    Page<Pack> findBySiteId(Long siteId, Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true AND p.isFeatured = true")
    List<Pack> findFeaturedPacks();

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true AND p.price BETWEEN :minPrice AND :maxPrice")
    Page<Pack> findByPriceRange(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice, Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true AND p.isLimitedOffer = true AND p.validUntil > :now")
    List<Pack> findActiveLimitedOffers(@Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Pack> searchPacks(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true AND p.maxPersons >= :persons")
    Page<Pack> findByMinPersons(@Param("persons") Integer persons, Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true ORDER BY p.soldCount DESC")
    List<Pack> findTopSellingPacks(Pageable pageable);

    @EntityGraph(attributePaths = {"site"})
    @Query("SELECT p FROM Pack p WHERE p.isActive = true ORDER BY p.rating DESC")
    List<Pack> findTopRatedPacks(Pageable pageable);
}