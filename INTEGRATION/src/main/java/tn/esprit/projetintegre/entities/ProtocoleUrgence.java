package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TypeUrgence;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "protocoles_urgence", indexes = {
    @Index(name = "idx_protocole_type", columnList = "typeUrgence"),
    @Index(name = "idx_protocole_site", columnList = "site_id"),
    @Index(name = "idx_protocole_actif", columnList = "actif")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProtocoleUrgence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 5000, message = "La description ne peut pas dépasser 5000 caractères")
    @Column(length = 5000)
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'urgence est obligatoire")
    private TypeUrgence typeUrgence;

    @ElementCollection
    @CollectionTable(name = "protocole_etapes", joinColumns = @JoinColumn(name = "protocole_id"))
    @Column(name = "etape", length = 1000)
    @OrderColumn(name = "ordre")
    @Builder.Default
    private List<String> etapes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "protocole_contacts", joinColumns = @JoinColumn(name = "protocole_id"))
    @Column(name = "contact", length = 200)
    @Builder.Default
    private List<String> contactsUrgence = new ArrayList<>();

    @Size(max = 2000, message = "Les ressources ne peuvent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String ressourcesNecessaires;

    @Size(max = 500, message = "Le point de rassemblement ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String pointRassemblement;

    @Min(value = 1, message = "La priorité doit être au moins 1")
    @Max(value = 5, message = "La priorité ne peut pas dépasser 5")
    @Builder.Default
    private Integer priorite = 3;

    @Builder.Default
    private Boolean actif = true;

    private LocalDateTime derniereRevision;
    private LocalDateTime prochaineRevision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cree_par")
    private User creePar;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
