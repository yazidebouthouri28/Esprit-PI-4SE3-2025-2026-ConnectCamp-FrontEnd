package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.HighlightCategory;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampHighlightRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 5000, message = "Content must be between 10 and 5000 characters")
    private String content;

    @NotNull(message = "Category is required")
    private HighlightCategory category;

    private String imageUrl;

    private Boolean isPublished;

    @NotNull(message = "Site ID is required")
    private Long siteId;
}
