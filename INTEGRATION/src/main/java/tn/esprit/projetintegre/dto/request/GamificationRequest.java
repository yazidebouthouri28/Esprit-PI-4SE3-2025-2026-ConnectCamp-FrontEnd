package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GamificationRequest {
    @NotBlank(message = "Le nom du badge est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String name;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    @NotBlank(message = "L'icône est obligatoire")
    private String icon;

    @Min(value = 0, message = "Les points ne peuvent pas être négatifs")
    @Max(value = 10000, message = "Le maximum de points est 10000")
    private int pointsValue;

    private Long organizerId;
}
