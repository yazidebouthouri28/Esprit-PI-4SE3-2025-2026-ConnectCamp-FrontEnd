package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {
    private Long id;
    private String name;
    private Long userId;
    private String userName;
    private Boolean isPublic;
    private List<ProductResponse> products;
    private Integer productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
