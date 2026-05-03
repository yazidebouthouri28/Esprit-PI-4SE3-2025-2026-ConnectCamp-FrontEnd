package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.Category;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @EntityGraph(attributePaths = {"products"})
    Optional<Category> findById(Long id);

    Optional<Category> findByName(String name);

    @EntityGraph(attributePaths = {"products"})
    Optional<Category> findBySlug(String slug);

    @EntityGraph(attributePaths = {"products"})
    List<Category> findAll();

    @EntityGraph(attributePaths = {"products"})
    List<Category> findByIsActiveTrue();

    List<Category> findByParentIsNull();

    List<Category> findByParentId(Long parentId);

    boolean existsByName(String name);
}