package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    private String name;
    
    private String description;
    private String slug;
    private String icon;
    private String image;
    private Long parentId;
    private Integer displayOrder;
    private Boolean isActive;
}
