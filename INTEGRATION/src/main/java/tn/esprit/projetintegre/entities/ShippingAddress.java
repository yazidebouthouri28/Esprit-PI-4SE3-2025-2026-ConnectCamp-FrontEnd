package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipping_addresses", indexes = {
    @Index(name = "idx_shipaddr_user", columnList = "user_id"),
    @Index(name = "idx_shipaddr_default", columnList = "isDefault")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShippingAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50, message = "Le libellé ne peut pas dépasser 50 caractères")
    private String label;

    @NotBlank(message = "Le nom du destinataire est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String recipientName;

    @Size(max = 20, message = "Le téléphone ne peut pas dépasser 20 caractères")
    private String phone;

    @NotBlank(message = "L'adresse ligne 1 est obligatoire")
    @Size(max = 200, message = "L'adresse ligne 1 ne peut pas dépasser 200 caractères")
    private String addressLine1;

    @Size(max = 200, message = "L'adresse ligne 2 ne peut pas dépasser 200 caractères")
    private String addressLine2;

    @NotBlank(message = "La ville est obligatoire")
    @Size(max = 100, message = "La ville ne peut pas dépasser 100 caractères")
    private String city;

    @Size(max = 100, message = "L'état/région ne peut pas dépasser 100 caractères")
    private String state;

    @NotBlank(message = "Le code postal est obligatoire")
    @Size(max = 20, message = "Le code postal ne peut pas dépasser 20 caractères")
    private String postalCode;

    @NotBlank(message = "Le pays est obligatoire")
    @Size(max = 100, message = "Le pays ne peut pas dépasser 100 caractères")
    private String country;

    @DecimalMin(value = "-90.0", message = "La latitude doit être entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être entre -90 et 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être entre -180 et 180")
    private Double longitude;

    @Size(max = 500, message = "Les instructions de livraison ne peuvent pas dépasser 500 caractères")
    @Column(length = 500)
    private String deliveryInstructions;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        sb.append(addressLine1);
        if (addressLine2 != null && !addressLine2.isEmpty()) {
            sb.append(", ").append(addressLine2);
        }
        sb.append(", ").append(city);
        if (state != null && !state.isEmpty()) {
            sb.append(", ").append(state);
        }
        sb.append(" ").append(postalCode);
        sb.append(", ").append(country);
        return sb.toString();
    }
}
